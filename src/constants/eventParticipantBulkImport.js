export const EVENT_PARTICIPANT_BULK_SIGNATURE_KEY = "_template_signature";
export const EVENT_PARTICIPANT_BULK_TEMPLATE_SIGNATURE_V2 = "LIFEGROUP_EVENT_PARTICIPANT_BULK_V2";
export const EVENT_PARTICIPANT_BULK_TEMPLATE_SIGNATURE = "LIFEGROUP_EVENT_PARTICIPANT_BULK_V3";
export const EVENT_PARTICIPANT_BULK_EVENT_ID_KEY = "_event_id";
export const EVENT_PARTICIPANT_BULK_CHURCH_ID_KEY = "_church_id";
export const EVENT_PARTICIPANT_BULK_SHEET_NAME = "Participants";

export const VALID_EVENT_PARTICIPANT_BULK_SIGNATURES = [
  EVENT_PARTICIPANT_BULK_TEMPLATE_SIGNATURE_V2,
  EVENT_PARTICIPANT_BULK_TEMPLATE_SIGNATURE
];

export const EVENT_PARTICIPANT_BULK_COLUMNS = [
  { header: "First Name*", key: "firstName" },
  { header: "Last Name*", key: "lastName" },
  { header: "Tag", key: "tag" },
  { header: "Phone", key: "phone" },
  { header: "Lifegroup", key: "lifeGroup" }
];
