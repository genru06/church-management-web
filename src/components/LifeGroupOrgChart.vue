<template>
  <div class="org-chart-wrapper">
    <div class="row items-center justify-between q-mb-sm">
      <div class="text-subtitle2 text-grey-8">
        Viewing: <span class="text-weight-bold">{{ currentRootName }}</span>
      </div>
      <div class="q-gutter-sm">
        <q-btn
          dense
          outline
          color="primary"
          icon="arrow_back"
          label="Back"
          :disable="!canGoBack"
          @click="goBack"
        />
        <q-btn
          dense
          flat
          color="primary"
          icon="vertical_align_top"
          label="Top"
          :disable="!canGoTop"
          @click="goTop"
        />
      </div>
    </div>
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Chart from "chart.js/auto";

const props = defineProps({
  coachId: { type: [String, Number], default: null },
  coachName: { type: String, default: "Coach" },
  coachTags: { type: Array, default: () => [] },
  members: { type: Array, default: () => [] },
  groupName: { type: String, default: "LifeGroup" }
});

const canvasRef = ref(null);
let chartInstance = null;
const ROOT_ID = "coach";
const currentRootId = ref(ROOT_ID);
const rootHistory = ref([]);
let renderedNodes = [];
let renderedEdges = [];
let nodeHitboxes = [];
let moveHandler = null;
let nodeMap = {};
let childrenByParent = {};

const canGoBack = computed(() => rootHistory.value.length > 0);
const canGoTop = computed(() => currentRootId.value !== ROOT_ID);
const currentRootName = computed(() => nodeMap[currentRootId.value]?.name || props.coachName);

const COLORS = ["#4ea3f1", "#3e78c7", "#4cb36e", "#5ea2ea", "#9a90e2", "#f0b55a", "#67c6c3", "#72b7d6"];

function isLifeCoach(tags = []) {
  return tags.includes("Life Coach");
}

function hasLifeCoachBelow(parentId, membersById) {
  const children = childrenByParent[parentId] || [];
  for (const childId of children) {
    const child = membersById.get(childId);
    if (child && isLifeCoach(child.tags)) return true;
    if (hasLifeCoachBelow(childId, membersById)) return true;
  }
  return false;
}

function memberRole(tags = []) {
  return isLifeCoach(tags) ? "Life Coach" : "Member";
}

function buildGraph() {
  const membersById = new Map(props.members.map((m) => [String(m.id), m]));
  const coachKey = ROOT_ID;
  const coachHasLifeCoachBelow = hasLifeCoachBelow(coachKey, membersById);

  nodeMap = {
    [coachKey]: {
      id: coachKey,
      name: props.coachName || "Coach",
      role: coachHasLifeCoachBelow ? "Network Coach" : "Life Coach",
      org: props.groupName,
      color: COLORS[0]
    }
  };

  childrenByParent = { [coachKey]: [] };

  props.members.forEach((member, index) => {
    const id = String(member.id);
    const parentIsCoach =
      !member.parentMemberId || Number(member.parentMemberId) === Number(props.coachId);
    const parentId = parentIsCoach ? coachKey : String(member.parentMemberId);
    if (!childrenByParent[parentId]) childrenByParent[parentId] = [];
    childrenByParent[parentId].push(id);

    nodeMap[id] = {
      id,
      name: member.name,
      role: memberRole(member.tags),
      org: props.groupName,
      color: COLORS[(index + 1) % COLORS.length]
    };
  });
}

const orgCardPlugin = {
  id: "orgCardPlugin",
  afterDraw(chart) {
    const { ctx, scales } = chart;
    const xScale = scales.x;
    const yScale = scales.y;

    const getPx = (node) => ({
      x: xScale.getPixelForValue(node.x),
      y: yScale.getPixelForValue(node.y)
    });

    const drawConnector = (parent, child) => {
      const p = getPx(parent);
      const c = getPx(child);
      const topY = p.y + 44;
      const bottomY = c.y - 44;
      const midY = topY + (bottomY - topY) / 2;

      ctx.strokeStyle = "#c5cad3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, topY);
      ctx.lineTo(p.x, midY);
      ctx.lineTo(c.x, midY);
      ctx.lineTo(c.x, bottomY);
      ctx.stroke();
    };

    renderedEdges.forEach(([parentId, childId]) => {
      const parent = renderedNodes.find((n) => n.id === parentId);
      const child = renderedNodes.find((n) => n.id === childId);
      if (parent && child) drawConnector(parent, child);
    });

    nodeHitboxes = [];

    renderedNodes.forEach((node) => {
      const p = getPx(node);
      const cardWidth = 210;
      const cardHeight = 84;
      const left = p.x - cardWidth / 2;
      const top = p.y - cardHeight / 2;

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#d9dee7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(left, top, cardWidth, cardHeight, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#35b5e5";
      ctx.fillRect(left, top, cardWidth, 3);

      const avatarX = left + 28;
      const avatarY = top + 32;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, 20, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      const initials = node.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(initials, avatarX, avatarY + 4);

      ctx.fillStyle = "#2f98d0";
      ctx.textAlign = "left";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(node.name, left + 56, top + 30);

      ctx.fillStyle = "#5f6775";
      ctx.font = "13px sans-serif";
      ctx.fillText(node.role, left + 56, top + 49);
      ctx.fillText(node.org, left + 56, top + 66);

      const hasChildren = Boolean(childrenByParent[node.id]?.length);
      ctx.beginPath();
      ctx.arc(left + 10, top + cardHeight - 10, 6, 0, Math.PI * 2);
      ctx.fillStyle = hasChildren ? "#3da4e6" : "#c3cad6";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(hasChildren ? "+" : "·", left + 10, top + cardHeight - 7);

      nodeHitboxes.push({
        id: node.id,
        left,
        top,
        right: left + cardWidth,
        bottom: top + cardHeight
      });
    });
  }
};

function buildVisibleTree(rootId) {
  const levels = [];
  const queue = [{ id: rootId, depth: 0 }];
  while (queue.length) {
    const { id, depth } = queue.shift();
    levels[depth] ||= [];
    levels[depth].push(id);
    (childrenByParent[id] || []).forEach((childId) => queue.push({ id: childId, depth: depth + 1 }));
  }

  const depthCount = Math.max(1, levels.length - 1);
  const nodesOut = [];
  levels.forEach((level, depth) => {
    const spread = Math.max(1, level.length);
    const y = 12 + depth * (74 / depthCount);
    level.forEach((id, idx) => {
      const x = spread === 1 ? 50 : 8 + (idx * 84) / (spread - 1);
      nodesOut.push({
        ...nodeMap[id],
        x,
        y
      });
    });
  });

  const visibleIds = new Set(nodesOut.map((n) => n.id));
  const edgesOut = [];
  Object.entries(childrenByParent).forEach(([parentId, childIds]) => {
    if (!visibleIds.has(parentId)) return;
    childIds.forEach((childId) => {
      if (visibleIds.has(childId)) edgesOut.push([parentId, childId]);
    });
  });

  return { nodesOut, edgesOut };
}

function renderChart() {
  if (!canvasRef.value) return;
  buildGraph();

  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) return;
  if (chartInstance) chartInstance.destroy();

  const { nodesOut, edgesOut } = buildVisibleTree(currentRootId.value);
  renderedNodes = nodesOut;
  renderedEdges = edgesOut;

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{ data: renderedNodes.map((node) => ({ x: node.x, y: node.y })), pointRadius: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      layout: { padding: { top: 12, right: 16, bottom: 24, left: 16 } },
      scales: {
        x: { min: 0, max: 100, display: false },
        y: { min: 0, max: 100, reverse: true, display: false }
      }
    },
    plugins: [orgCardPlugin]
  });
}

function clickCanvas(event) {
  if (!chartInstance) return;
  const x = event.offsetX;
  const y = event.offsetY;
  const hit = nodeHitboxes.find((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
  if (!hit || !childrenByParent[hit.id]?.length) return;
  rootHistory.value.push(currentRootId.value);
  currentRootId.value = hit.id;
  renderChart();
}

function goBack() {
  if (!rootHistory.value.length) return;
  currentRootId.value = rootHistory.value.pop();
  renderChart();
}

function goTop() {
  rootHistory.value = [];
  currentRootId.value = ROOT_ID;
  renderChart();
}

function resetNavigation() {
  rootHistory.value = [];
  currentRootId.value = ROOT_ID;
}

onMounted(() => {
  renderChart();
  canvasRef.value?.addEventListener("click", clickCanvas);
  moveHandler = (event) => {
    const hit = nodeHitboxes.find(
      (box) =>
        event.offsetX >= box.left &&
        event.offsetX <= box.right &&
        event.offsetY >= box.top &&
        event.offsetY <= box.bottom
    );
    canvasRef.value.style.cursor = hit && childrenByParent[hit.id]?.length ? "pointer" : "default";
  };
  canvasRef.value?.addEventListener("mousemove", moveHandler);
});

onBeforeUnmount(() => {
  canvasRef.value?.removeEventListener("click", clickCanvas);
  if (moveHandler) canvasRef.value?.removeEventListener("mousemove", moveHandler);
  if (chartInstance) chartInstance.destroy();
});

watch(
  () => [props.coachName, props.members, props.groupName],
  () => {
    resetNavigation();
    renderChart();
  },
  { deep: true }
);
</script>

<style scoped>
.org-chart-wrapper {
  height: 100%;
  min-height: 420px;
  width: 100%;
}
</style>
