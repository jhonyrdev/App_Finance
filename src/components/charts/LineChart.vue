<script setup lang="ts">
import { computed, inject } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  type ChartOptions,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
);

const t: any = inject("translations");

interface DataPoint {
  date: Date | string;
  amount: number;
}

interface Props {
  data: DataPoint[];
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: "Savings",
});

const chartData = computed(() => {
  const sortedData = [...props.data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const labels = sortedData.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString(t.value.lang === "ES" ? "es-PE" : "en-US", {
      month: "short",
      day: "numeric",
    });
  });

  const amounts = sortedData.map((d) => d.amount);

  // Determine if trend is positive or negative
  const firstAmount = amounts[0] ?? 0;
  const lastAmount = amounts[amounts.length - 1] ?? 0;
  const isPositive = amounts.length > 1 && lastAmount >= firstAmount;

  return {
    labels,
    datasets: [
      {
        label: props.label,
        data: amounts,
        borderColor: isPositive ? "#10B981" : "#EF4444",
        backgroundColor: isPositive
          ? "rgba(16, 185, 129, 0.1)"
          : "rgba(239, 68, 68, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: isPositive ? "#10B981" : "#EF4444",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };
});

const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context) => {
          return `$${(context.parsed.y ?? 0).toFixed(2)}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value) => `$${value}`,
      },
      grid: {
        color: "rgba(0, 0, 0, 0.05)",
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
  animation: {
    duration: 750,
    easing: "easeInOutQuart",
  },
  interaction: {
    intersect: false,
    mode: "index",
  },
};
</script>

<template>
  <div class="chart-container" role="img" :aria-label="t.savingsView.title">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 18.75rem;
  container-type: inline-size;
}

@media (max-width: 768px) {
  .chart-container {
    min-height: 15.625rem;
  }
}
</style>
