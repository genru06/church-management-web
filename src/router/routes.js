import MainLayout from "src/layouts/MainLayout.vue";
import PublicLayout from "src/layouts/PublicLayout.vue";
import LoginPage from "src/pages/LoginPage.vue";
import DashboardPage from "src/pages/DashboardPage.vue";
import MembersListPage from "src/pages/MembersListPage.vue";
import MemberFormPage from "src/pages/MemberFormPage.vue";
import MemberDetailsPage from "src/pages/MemberDetailsPage.vue";
import ChurchesListPage from "src/pages/ChurchesListPage.vue";
import ChurchFormPage from "src/pages/ChurchFormPage.vue";
import ChurchDetailsPage from "src/pages/ChurchDetailsPage.vue";
import LifeGroupsListPage from "src/pages/LifeGroupsListPage.vue";
import LifeGroupFormPage from "src/pages/LifeGroupFormPage.vue";
import LifeGroupDetailsPage from "src/pages/LifeGroupDetailsPage.vue";
import AttendancePage from "src/pages/AttendancePage.vue";
import EventsListPage from "src/pages/EventsListPage.vue";
import EventDashboardPage from "src/pages/EventDashboardPage.vue";
import EventAttendancePage from "src/pages/EventAttendancePage.vue";
import EventScanPage from "src/pages/EventScanPage.vue";
import EventRegistrationPage from "src/pages/EventRegistrationPage.vue";
import EventSignupPage from "src/pages/EventSignupPage.vue";
import EventSignupQrPage from "src/pages/EventSignupQrPage.vue";
import OperationsPage from "src/pages/OperationsPage.vue";

const routes = [
  { path: "/login", component: LoginPage },
  {
    path: "/events/:id/signup",
    component: PublicLayout,
    children: [{ path: "", component: EventSignupPage, props: (route) => ({ id: route.params.id }) }]
  },
  {
    path: "/events/:id/signup-qr",
    component: PublicLayout,
    children: [{ path: "", component: EventSignupQrPage, props: (route) => ({ id: route.params.id }) }]
  },
  {
    path: "/events/:id/register/:participantId",
    component: PublicLayout,
    children: [
      {
        path: "",
        component: EventRegistrationPage,
        props: (route) => ({ id: route.params.id, participantId: route.params.participantId })
      }
    ]
  },
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", redirect: "/dashboard" },
      { path: "dashboard", component: DashboardPage },
      { path: "members", component: MembersListPage },
      { path: "members/add", component: MemberFormPage, props: { mode: "create" } },
      { path: "members/:id", component: MemberDetailsPage, props: true },
      { path: "members/:id/edit", component: MemberFormPage, props: route => ({ mode: "edit", id: route.params.id }) },
      { path: "churches", component: ChurchesListPage },
      { path: "churches/add", component: ChurchFormPage, props: { mode: "create" } },
      { path: "churches/:id", component: ChurchDetailsPage, props: true },
      { path: "churches/:id/edit", component: ChurchFormPage, props: route => ({ mode: "edit", id: route.params.id }) },
      { path: "lifegroups", component: LifeGroupsListPage },
      { path: "lifegroups/add", component: LifeGroupFormPage, props: { mode: "create" } },
      { path: "lifegroups/:id", component: LifeGroupDetailsPage, props: true },
      { path: "lifegroups/:id/edit", component: LifeGroupFormPage, props: route => ({ mode: "edit", id: route.params.id }) },
      { path: "attendance", component: AttendancePage },
      { path: "events", component: EventsListPage },
      { path: "events/:id", component: EventDashboardPage, props: true },
      { path: "events/:id/attendance", component: EventAttendancePage, props: true },
      { path: "events/:id/scan", component: EventScanPage, props: true },
      { path: "operations", component: OperationsPage }
    ]
  },
  { path: "/:catchAll(.*)*", redirect: "/dashboard" }
];

export default routes;
