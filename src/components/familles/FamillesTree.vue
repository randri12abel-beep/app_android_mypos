<script setup>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const props = defineProps({
    nodes: {
        type: Array,
        default: () => []
    },
    selectionKeys: {
        type: Object,
        default: () => ({})
    },
    expandedKeys: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits([
    'create', 'show', 'update', 'delete', 'reload', 'select', 
    'update:selectionKeys', 'update:expandedKeys'
]);

const filters = ref({});

const onNodeSelect = (event) => {
    const node = event.node || event;
    emit('select', node);
};

</script>

<template>
  <div class="h-full bg-white flex flex-col">
    <TreeTable 
        :value="nodes" 
        :filters="filters" 
        filterMode="lenient"
        selectionMode="single" 
        :selectionKeys="selectionKeys"
        @update:selectionKeys="(val) => $emit('update:selectionKeys', val)"
        :expandedKeys="expandedKeys"
        @update:expandedKeys="(val) => $emit('update:expandedKeys', val)"
        @nodeSelect="onNodeSelect" 
        :metaKeySelection="false"
        class="border-0 p-0 text-sm flex-1 overflow-auto custom-tree-table"
        :pt="{
            thead: { class: 'hidden' },
            body: { class: 'border-0' }
        }"
    >
        <!-- Header minimal avec Recherche Orange -->
        <template #header>
            <div class="flex items-center gap-3 px-1 py-1">
                <div class="relative flex-1">
                    <InputText 
                        v-model="filters['global']" 
                        placeholder="Rechercher une catégorie..." 
                        class="w-full px-4 py-2 text-xs border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 rounded-xl bg-gray-50/50 font-medium" 
                    />
                </div>
                <Button 
                    icon="pi pi-refresh" 
                    severity="secondary" 
                    rounded 
                    text 
                    @click="emit('reload')" 
                    class="hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors h-8 w-8"
                />
            </div>
        </template>

        <!-- Colonne unique avec Icônes Dynamiques -->
        <Column field="name" header="Nom" expander style="width: 100%">
            <template #body="slotProps">
                <div class="flex items-center py-1">
                    <!-- Icône : Box pour ceux qui ont des enfants, Tag pour les feuilles -->
                    <i 
                        :class="[
                            (slotProps.node.children && slotProps.node.children.length > 0) 
                                ? 'pi pi-box' 
                                : 'pi pi-tag',
                            (selectedKey && selectedKey[slotProps.node.key])
                                ? 'text-orange-600'
                                : ((!slotProps.node.data.parent_id || slotProps.node.data.parent_id === 0) ? 'text-indigo-600' : 'text-orange-600')
                        ]" 
                        class="text-base mr-3 transition-colors duration-200"
                    />
                    <span 
                        class="font-bold tracking-tight transition-colors"
                        :class="selectedKey && selectedKey[slotProps.node.key] ? 'text-orange-600' : 'text-gray-700'"
                    >
                        {{ slotProps.node.data.name }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Message vide stylisé -->
        <template #empty>
            <div class="flex flex-col items-center justify-center py-12 px-4 text-gray-400 opacity-60">
                <i class="pi pi-folder-open text-4xl mb-3" />
                <p class="text-xs font-bold uppercase tracking-widest">Aucune famille trouvée</p>
            </div>
        </template>
    </TreeTable>
  </div>
</template>

<style scoped>
:deep(.p-treetable-toggler) {
    color: #FF7900 !important;
    width: 2rem !important;
    height: 2rem !important;
    transition: all 0.2s;
}

:deep(.p-treetable-toggler:hover) {
    background: #FFF8F1 !important;
}

:deep(.p-treetable-tbody > tr.p-highlight) {
    background: #FFF8F1 !important;
    color: #FF7900 !important;
}

:deep(.p-treetable-tbody > tr:focus) {
    box-shadow: inset 0 0 0 0.15rem rgba(255, 121, 0, 0.2) !important;
}

:deep(.p-treetable-tbody > tr) {
    transition: background-color 0.2s;
    border-bottom: 1px solid rgba(243, 244, 246, 0.6) !important;
}

:deep(.p-treetable .p-treetable-tbody > tr > td) {
    border: none !important;
    padding: 0.5rem 0.75rem !important;
}

:deep(.p-column-resizer) {
    display: none !important;
}
</style>
