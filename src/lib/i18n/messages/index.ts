import { commonMessages } from "./common";
import { homeMessages } from "./home";
import { filtersMessages } from "./filters";
import { propertyMessages } from "./property";
import { addPropertyMessages } from "./addProperty";
import { marketGuideMessages } from "./marketGuide";
import { legalMessages } from "./legal";
import { registerMessages } from "./register";
import { adminMessages } from "./admin";
import { professionalsMessages } from "./professionals";
import { propertyRequestsMessages } from "./propertyRequests";

/** قاموس الرسائل الموحّد لكل المنصة */
export const messages = {
  ...commonMessages,
  ...homeMessages,
  ...filtersMessages,
  ...propertyMessages,
  ...addPropertyMessages,
  ...marketGuideMessages,
  ...legalMessages,
  ...registerMessages,
  ...adminMessages,
  ...professionalsMessages,
  ...propertyRequestsMessages,
};

/** كل مفاتيح الترجمة المتاحة — مضمونة النوع عند وقت البناء */
export type MessageKey = keyof typeof messages;
