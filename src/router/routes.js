import MainLayout from "src/layouts/MainLayout.vue";
import PublicLayout from "src/layouts/PublicLayout.vue";
import LoginPage from "src/pages/LoginPage.vue";
import DashboardPage from "src/pages/DashboardPage.vue";
import MembersListPage from "src/pages/MembersListPage.vue";
import MembersPrintPage from "src/pages/MembersPrintPage.vue";
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
import EventAttendancePrintPage from "src/pages/EventAttendancePrintPage.vue";
import EventScanPage from "src/pages/EventScanPage.vue";
import EventRegistrationPage from "src/pages/EventRegistrationPage.vue";
import EventSignupPage from "src/pages/EventSignupPage.vue";
import EventSignupQrPage from "src/pages/EventSignupQrPage.vue";
import OperationsPage from "src/pages/OperationsPage.vue";
import UsersListPage from "src/pages/UsersListPage.vue";
import TagsPage from "src/pages/TagsPage.vue";
import AclPage from "src/pages/AclPage.vue";

const routes = [
  {
    path: "/login",
    component: PublicLayout,
    meta: { public: true },
    children: [{ path: "", component: LoginPage, meta: { public: true } }]
  },
  {
    path: "/events/:id/signup",
    component: PublicLayout,
    meta: { public: true },
    children: [
      {
        path: "",
        component: EventSignupPage,
        meta: { public: true },
        props: (route) => ({ id: route.params.id })
      }
    ]
  },
  {
    path: "/events/:id/signup-qr",
    component: PublicLayout,
    meta: { public: true },
    children: [
      {
        path: "",
        component: EventSignupQrPage,
        meta: { public: true },
        props: (route) => ({ id: route.params.id })
      }
    ]
  },
  {
    path: "/events/:id/register/:participantId",
    component: PublicLayout,
    meta: { public: true },
    children: [
      {
        path: "",
        component: EventRegistrationPage,
        meta: { public: true },
        props: (route) => ({ id: route.params.id, participantId: route.params.participantId })
      }
    ]
  },
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", redirect: "/dashboard" },
      { path: "dashboard", component: DashboardPage, meta: { page: "dashboard" } },
      { path: "members", component: MembersListPage, meta: { page: "members" } },
      { path: "members/print", component: MembersPrintPage, meta: { page: "members" } },
      { path: "members/add", component: MemberFormPage, props: { mode: "create" }, meta: { page: "members" } },
      { path: "members/:id", component: MemberDetailsPage, props: true, meta: { page: "members" } },
      { path: "members/:id/edit", component: MemberFormPage, props: route => ({ mode: "edit", id: route.params.id }), meta: { page: "members" } },
      { path: "churches", component: ChurchesListPage, meta: { page: "churches" } },
      { path: "churches/add", component: ChurchFormPage, props: { mode: "create" }, meta: { page: "churches" } },
      { path: "churches/:id", component: ChurchDetailsPage, props: true, meta: { page: "churches" } },
      { path: "churches/:id/edit", component: ChurchFormPage, props: route => ({ mode: "edit", id: route.params.id }), meta: { page: "churches" } },
      { path: "lifegroups", component: LifeGroupsListPage, meta: { page: "lifegroups" } },
      { path: "lifegroups/add", component: LifeGroupFormPage, props: { mode: "create" }, meta: { page: "lifegroups" } },
      { path: "lifegroups/:id", component: LifeGroupDetailsPage, props: true, meta: { page: "lifegroups" } },
      { path: "lifegroups/:id/edit", component: LifeGroupFormPage, props: route => ({ mode: "edit", id: route.params.id }), meta: { page: "lifegroups" } },
      { path: "attendance", component: AttendancePage, meta: { page: "attendance" } },
      { path: "events", component: EventsListPage, meta: { page: "events" } },
      { path: "events/:id", component: EventDashboardPage, props: true, meta: { page: "events" } },
      { path: "events/:id/attendance", component: EventAttendancePage, props: true, meta: { page: "events" } },
      { path: "events/:id/attendance/print", component: EventAttendancePrintPage, props: true, meta: { page: "events" } },
      { path: "events/:id/scan", component: EventScanPage, props: true, meta: { page: "events" } },
      { path: "operations", component: OperationsPage, meta: { page: "operations" } },
      { path: "users", component: UsersListPage, meta: { page: "users" } },
      { path: "tags", component: TagsPage, meta: { page: "tags" } },
      { path: "acl", component: AclPage, meta: { page: "acl" } }
    ]
  },
  { path: "/:catchAll(.*)*", redirect: "/dashboard" }
];

export default routes;
