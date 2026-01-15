<script setup lang="ts">
import { computed, inject } from "vue";
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartOptions,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const t: any = inject("translations");

interface Props {
  labels: string[];
  data: number[];
  backgroundColor?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  backgroundColor: () => [
    "#3B82F6",
    "#F97316",
    "#10B981",
    "#8B5CF6",
    "#EC4899",
  ],
});

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      backgroundColor: props.backgroundColor,
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
}));

const chartOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        padding: 16,
        font: {
          size: 13,
        },
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context) => {
          const label = context.label || "";
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce(
            (a: number, b: number) => a + b,
            0
          );
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: $${value} (${percentage}%)`;
        },
      },
    },
  },
  animation: {
    animateRotate: true,
    animateScale: true,
    duration: 750,
    easing: "easeInOutQuart",
  },
};
</script>

<template>
  <div
    class="chart-container"
    role="img"
    :aria-label="t.analyticsView.budgetDistribution"
  >
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 18.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  container-type: inline-size;
}

@media (max-width: 768px) {
  .chart-container {
    min-height: 15.625rem;
  }
}
</style>
