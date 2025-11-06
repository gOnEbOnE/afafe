<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useLocationStore } from '@/stores/location/location.store';
import { storeToRefs } from 'pinia';

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string | string[]): void;
  (e: 'change', value: string | string[]): void;
}

withDefaults(defineProps<Props>(), {
  label: 'Location',
  placeholder: 'Select a province...',
  required: false,
  disabled: false,
  multiple: false,
});

const emit = defineEmits<Emits>();

const locationStore = useLocationStore();
const { provinces, loading } = storeToRefs(locationStore);

const isOpen = ref(false);
const searchQuery = ref('');

const filteredProvinces = computed(() => {
  if (!searchQuery.value.trim()) {
    return provinces.value;
  }
  return locationStore.searchProvinces(searchQuery.value);
});

const handleSelect = (provinceName: string) => {
  emit('update:modelValue', provinceName);
  emit('change', provinceName);
  isOpen.value = false;
  searchQuery.value = '';
};

const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

onMounted(async () => {
  await locationStore.fetchProvinces();
});
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Dropdown Wrapper -->
    <div class="relative">
      <!-- Input / Trigger Button -->
      <div
        @click="isOpen = !isOpen"
        :class="[
          'w-full px-4 py-2 border rounded-lg cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-green-500',
          'flex items-center justify-between',
          'bg-white hover:bg-gray-50 transition',
          'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]"
      >
        <span :class="modelValue ? 'text-gray-900' : 'text-gray-400'">
          {{ modelValue || placeholder }}
        </span>
        <svg
          :class="[
            'w-5 h-5 transition-transform',
            isOpen ? 'transform rotate-180' : '',
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      <!-- Dropdown Menu -->
      <div
        v-show="isOpen"
        class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-hidden"
      >
        <!-- Search Input -->
        <div class="p-3 border-b bg-gray-50">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search province..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            @click.stop
          />
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="p-4 text-center text-gray-500">
          <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <p class="mt-2 text-sm">Loading provinces...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredProvinces.length === 0" class="p-4 text-center text-gray-500">
          <p class="text-sm">No provinces found</p>
        </div>

        <!-- Options List -->
        <ul v-else class="overflow-y-auto max-h-56">
          <li
            v-for="province in filteredProvinces"
            :key="province.code"
            @click="handleSelect(province.name)"
            :class="[
              'px-4 py-2 cursor-pointer transition',
              'hover:bg-green-50 border-l-4 border-transparent',
              modelValue === province.name
                ? 'bg-green-100 border-l-green-500 text-green-900 font-semibold'
                : 'hover:border-l-gray-300',
            ]"
          >
            <div class="flex items-center justify-between">
              <span>{{ province.name }}</span>
              <span v-if="modelValue === province.name" class="text-green-600">✓</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="locationStore.error" class="mt-1 text-sm text-red-500">
      {{ locationStore.error }}
    </p>
  </div>
</template>

<style scoped>
/* Smooth transitions */
div {
  transition: all 0.2s ease;
}
</style>
