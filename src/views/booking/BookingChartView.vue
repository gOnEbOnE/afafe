<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'vue-chartjs'
import { toast } from 'vue-sonner'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const router = useRouter()

interface ChartData {
  period: string
  year: number
  labels: string[]
  data: number[]
  backgroundColor: string
  borderColor: string
}

const period = ref('Monthly')
const year = ref(new Date().getFullYear())
const chartData = ref<ChartData | null>(null)
const loading = ref(false)
const error = ref('')

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      labels: {
        boxWidth: 15,
        padding: 15,
        font: {
          size: 14,
          weight: 'bold'
        }
      }
    },
    title: {
      display: true,
      font: {
        size: 16,
        weight: 'bold'
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      },
      title: {
        display: true,
        text: 'Number of Bookings'
      }
    },
    x: {
      title: {
        display: true,
        text: period.value
      }
    }
  }
}

const fetchChartData = async () => {
  loading.value = true
  error.value = ''

  try {
    console.log('📊 Fetching chart data...')
    console.log('   Period:', period.value)
    console.log('   Year:', year.value)

    // ✅ UPDATED: Removed duplicate /api prefix
    const response = await axios.get('http://localhost:8080/api/bookings/chart', {
      params: {
        period: period.value,
        year: year.value
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 Response status:', response.status)
    console.log('📊 Response data:', response.data)
    console.log('📊 Response data type:', typeof response.data)
    console.log('📊 Response data.data:', response.data.data)

    // ✅ FIXED: Check response structure correctly
    if (response.data && response.data.status === 200 && response.data.data) {
      chartData.value = response.data.data
      console.log('✅ Chart data loaded successfully')
      console.log('   Labels:', chartData.value.labels)
      console.log('   Data:', chartData.value.data)
      toast.success('Chart data loaded successfully')
    } else {
      const errorMsg = response.data?.message || 'Invalid response format'
      error.value = errorMsg
      console.error('❌ Response error:', errorMsg)
      toast.error(errorMsg)
    }
  } catch (err: any) {
    console.error('❌ Fetch error:', err)
    console.error('   Error message:', err.message)
    console.error('   Response status:', err.response?.status)
    console.error('   Response data:', err.response?.data)

    let errMsg = 'Failed to load chart data'

    if (err.response?.data?.message) {
      errMsg = err.response.data.message
    } else if (err.response?.statusText) {
      errMsg = err.response.statusText
    } else if (err.message) {
      errMsg = err.message
    }

    error.value = errMsg
    toast.error(errMsg)
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  fetchChartData()
}

const handleReset = () => {
  period.value = 'Monthly'
  year.value = new Date().getFullYear()
  fetchChartData()
}

const goBack = () => {
  router.push({ name: 'bookings' })
}

const getPreparedChartData = () => {
  if (!chartData.value) return null

  return {
    labels: chartData.value.labels,
    datasets: [
      {
        label: 'Bookings',
        data: chartData.value.data,
        backgroundColor: chartData.value.backgroundColor,
        borderColor: chartData.value.borderColor,
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(22, 163, 74, 0.8)'
      }
    ]
  }
}

const getChartTitle = () => {
  const periodText = period.value === 'Monthly' ? 'Monthly' : 'Quarterly'
  return `Booking Results (${periodText}) for ${year.value}`
}

watch([period, year], () => {
  fetchChartData()
})

onMounted(() => {
  fetchChartData()
})
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Vehicle Rental App</h1>
          <div class="flex gap-2">
            <router-link
              to="/vehicles"
              class="px-4 py-2 text-gray-600 hover:text-gray-900 transition font-medium"
            >
              Vehicles
            </router-link>
            <router-link
              to="/bookings"
              class="px-4 py-2 text-gray-600 hover:text-gray-900 transition font-medium"
            >
              Bookings
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Title -->
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-8">
        Rental Booking Dashboard
      </h2>

      <!-- Filter Section -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <!-- Period Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              View by
            </label>
            <select
              v-model="period"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </div>

          <!-- Year Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              v-model.number="year"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <!-- Buttons -->
          <div class="flex gap-2 md:col-span-2 items-end">
            <button
              @click="handleFilter"
              class="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              🔍 Filter
            </button>
            <button
              @click="handleReset"
              class="flex-1 px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-semibold"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="bg-white rounded-lg shadow p-8 mb-8">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p class="text-gray-500 mt-4">Loading chart...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {{ error }}
        </div>

        <!-- Chart -->
        <div v-else-if="getPreparedChartData()">
          <h3 class="text-xl font-bold text-center text-gray-900 mb-6">
            {{ getChartTitle() }}
          </h3>
          <div class="relative h-96">
            <Bar
              :data="getPreparedChartData()"
              :options="chartOptions"
              class="w-full"
            />
          </div>

          <!-- Chart Data Table -->
          <div class="mt-8 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-100 border-b">
                  <th class="px-6 py-3 text-left font-semibold text-gray-900">
                    {{ period === 'Monthly' ? 'Month' : 'Quarter' }}
                  </th>
                  <th class="px-6 py-3 text-left font-semibold text-gray-900">
                    Number of Bookings
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="(label, index) in chartData?.labels"
                  :key="index"
                  class="hover:bg-gray-50"
                >
                  <td class="px-6 py-3 font-semibold text-gray-900">{{ label }}</td>
                  <td class="px-6 py-3 text-gray-900">
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold">
                      {{ chartData?.data[index] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <p class="text-gray-500">No data available</p>
        </div>
      </div>

      <!-- Back Button -->
      <div class="flex justify-center">
        <button
          @click="goBack"
          class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
        >
          ← Back to Bookings
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Chart container styling */
:deep(.chartjs-render-monitor) {
  display: block !important;
}
</style>
