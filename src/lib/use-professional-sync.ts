"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyRemoteValue } from "@/lib/cloud/push";
import {
  PROFESSIONALS_EVENT,
  PROFESSIONALS_KEY,
  getProfessionals,
  type ProfessionalRecord,
} from "@/lib/professionals-store";

export type ProfessionalSyncState =
  | "idle"
  | "loading"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

interface ServerRecordResponse {
  ok?: boolean;
  error?: string;
  message?: string;
  record?: ProfessionalRecord;
  current?: ProfessionalRecord;
  updatedAt?: string;
}

function mergeServerRecord(record: ProfessionalRecord, updatedAt: string): void {
  const records = getProfessionals();
  const next = [record, ...records.filter((item) => item.id !== record.id)];
  applyRemoteValue(PROFESSIONALS_KEY, next, updatedAt);
}

export function useProfessionalSync(
  enabled: boolean,
  identity: string
): {
  state: ProfessionalSyncState;
  message: string;
  loading: boolean;
  retry: () => void;
} {
  const [state, setState] = useState<ProfessionalSyncState>("idle");
  const [message, setMessage] = useState("");
  const recordId = useRef("");
  const version = useRef(1);
  const pending = useRef(false);
  const syncing = useRef(false);
  const dirty = useRef(false);
  const ignoreEvent = useRef(false);
  const retryAction = useRef<() => void>(() => undefined);

  const retry = useCallback(() => retryAction.current(), []);

  useEffect(() => {
    if (!enabled) {
      setState("idle");
      setMessage("");
      return;
    }

    let alive = true;
    let removeStoreListener: () => void = () => undefined;
    window.__AQAAR_OWN_PROFESSIONAL_SYNC__ = true;

    const apply = (record: ProfessionalRecord, updatedAt: string) => {
      ignoreEvent.current = true;
      try {
        mergeServerRecord(record, updatedAt);
      } finally {
        ignoreEvent.current = false;
      }
    };

    const drain = async () => {
      if (syncing.current || !alive) return;
      syncing.current = true;
      while (pending.current && alive) {
        pending.current = false;
        const current = getProfessionals().find(
          (item) => item.id === recordId.current
        );
        if (!current) break;
        dirty.current = true;
        setState("saving");
        setMessage("جارٍ حفظ التعديلات على السيرفر…");
        try {
          const response = await fetch("/api/professional/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              record: current,
              expectedVersion: version.current,
            }),
          });
          const data = (await response.json().catch(() => ({}))) as ServerRecordResponse;
          if (!alive) break;
          if (response.status === 409) {
            setState("conflict");
            setMessage(
              data.message ||
                "يوجد تعديل أحدث من جهاز آخر. حدّث الصفحة قبل إعادة الحفظ."
            );
            break;
          }
          if (!response.ok || !data.record || !data.updatedAt) {
            throw new Error(data.message || "تعذر حفظ التعديلات على السيرفر");
          }
          version.current = data.record.version ?? version.current + 1;
          if (!pending.current) {
            apply(data.record, data.updatedAt);
            dirty.current = false;
            setState("saved");
            setMessage("تم حفظ التعديلات على السيرفر");
          }
        } catch (error) {
          if (!alive) break;
          setState("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "تعذر حفظ التعديلات على السيرفر"
          );
          break;
        }
      }
      syncing.current = false;
    };

    const queueSave = () => {
      if (ignoreEvent.current || !recordId.current) return;
      pending.current = true;
      dirty.current = true;
      retryAction.current = () => {
        pending.current = true;
        void drain();
      };
      void drain();
    };

    const load = async () => {
      setState("loading");
      setMessage("جارٍ تحميل ملفك من السيرفر…");
      try {
        const response = await fetch("/api/professional/me", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as ServerRecordResponse;
        if (!response.ok || !data.record || !data.updatedAt) {
          throw new Error(
            response.status === 404
              ? "لا يوجد ملف مهني مرتبط بهذا الحساب"
              : "تعذر تحميل الملف المهني من السيرفر"
          );
        }
        if (!alive) return;
        recordId.current = data.record.id;
        version.current = data.record.version ?? 1;
        apply(data.record, data.updatedAt);
        dirty.current = false;
        setState("saved");
        setMessage("الملف متزامن مع السيرفر");
        window.addEventListener(PROFESSIONALS_EVENT, queueSave);
        removeStoreListener = () =>
          window.removeEventListener(PROFESSIONALS_EVENT, queueSave);
      } catch (error) {
        if (!alive) return;
        setState("error");
        setMessage(
          error instanceof Error ? error.message : "تعذر تحميل الملف المهني"
        );
        retryAction.current = () => void load();
      }
    };

    retryAction.current = () => void load();
    void load();

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);

    return () => {
      alive = false;
      removeStoreListener();
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.__AQAAR_OWN_PROFESSIONAL_SYNC__ = false;
    };
  }, [enabled, identity]);

  return {
    state,
    message,
    loading: enabled && (state === "idle" || state === "loading"),
    retry,
  };
}
