export const DEFAULT_CITY_ID = 998;

export const memberTags = [
  "Life Coach",
  "Network Coach",
  "SLI 1",
  "SLI 2",
  "SLI 3",
  "SLI 4",
  "Already Baptized",
  "Pastor",
  "Pastor's Wife",
  "Executive Pastor",
  "Church Administrator",
  "Church Treasurer",
  "Church Secretary",
  "House Church Director",
  "Church Discipleship Director",
  "Church Planting Director",
];

export const members = [
  {
    id: 1,
    lastName: "Reyes",
    firstName: "Ana",
    email: "ana.reyes@mail.com",
    phone: "09171234567",
    address: "123 Mabini St",
    city: "Davao",
    province: "Davao del Sur",
    barangay: "Talomo",
    zip: "8000",
    country: "Philippines",
    dateOfBirth: "1990-10-12",
    gender: "Female",
    maritalStatus: "Married",
    nationality: "Filipino",
    tags: ["Life Coach", "SLI 4"]
  }
];

export const churches = [
  { id: 1, name: "Hope Church", address: "Central District", pastorMemberId: 1 }
];

export const lifeGroups = [
  { id: 1, name: "Faith Builders", coachMemberId: 1 }
];

export const attendance = [
  { id: 1, lifeGroupId: 1, weekOf: "2026-03-22", presentCount: 12 }
];
