<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Tree from 'primevue/tree';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const props = defineProps({
    nodes: {
        type: Array,
        default: () => []
    },
    currentId: {
        type: [Number, String],
        required: true
    }
});

const emit = defineEmits(['select', 'cancel']);

const filters = ref('');
const selectedKey = ref(null);
const isMobileOrTablet = ref(false);

const checkScreen = () => {
    isMobileOrTablet.value = window.innerWidth < 1024;
};

onMounted(() => {
    checkScreen();
    window.addEventListener('resize', checkScreen);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkScreen);
});

// Filtrer l'arbre pour ne pas afficher la famille actuelle ni ses descendants
// (On ne peut pas déplacer une famille dans elle-même ou ses enfants)
const filterSelfAndDescendants = (nodes, targetId) => {
    return nodes
        .filter(node => node.key !== targetId.toString())
        .map(node => ({
            ...node,
            children: node.children ? filterSelfAndDescendants(node.children, targetId) : []
        }));
};

const processedNodes = computed(() => {
    // Transformer les nodes pour PrimeVue Tree (label au lieu de name dans data)
    const mapNodes = (nodes, level = 0) => {
        return nodes.map(node => ({
            key: node.key,
            label: node.data.name,
            data: node.data,
            // Icône : Box pour ceux qui ont des enfants, Tag pour les feuilles
            icon: (node.children && node.children.length > 0) ? 'pi pi-box' : 'pi pi-tag',
            level: level,
            children: node.children ? mapNodes(node.children, level + 1) : []
        }));
    };

    const filtered = filterSelfAndDescendants(props.nodes, props.currentId);
    return mapNodes(filtered);
});

const onConfirm = () => {
    if (selectedKey.value) {
        // Trouver le nœud correspondant à la clé sélectionnée
        const findNode = (nodes, key) => {
            for (const node of nodes) {
                if (node.key === key) return node;
                if (node.children) {
                    const found = findNode(node.children, key);
                    if (found) return found;
                }
            }
            return null;
        };

        const selectedNode = findNode(processedNodes.value, Object.keys(selectedKey.value)[0]);
        if (selectedNode) {
            emit('select', selectedNode.data);
        }
    }
};

const onSetAsRoot = () => {
    emit('select', { name: 'Racine (Niveau 0)', familles_id: 0 });
};
</script>

<template>
    <div class="flex flex-col h-full bg-white relative overflow-hidden">
        <!-- Header Fixe -->
        <div class="shrink-0 bg-[#FFF8F1] border-b border-gray-100 p-6">
            <h3 class="text-lg font-black text-[#1A1A1A] uppercase tracking-wider flex items-center gap-3">
                <span class="w-1.5 h-6 bg-[#FF7900] rounded-full"></span>
                Choisir une destination
            </h3>
            <p class="text-xs text-gray-500 mt-1 ml-4.5 font-medium uppercase tracking-widest opacity-70">
                Sélectionnez la catégorie parente
            </p>
        </div>

        <!-- Corps Défilable -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30">
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="p-2">
                    <Tree 
                        v-model:selectionKeys="selectedKey"
                        :value="processedNodes" 
                        selectionMode="single"
                        :filter="true"
                        filterMode="lenient"
                        class="border-0 p-0 text-sm"
                    >
                        <template #nodeicon="slotProps">
                            <i 
                                :class="[
                                    slotProps.node.icon, 
                                    (selectedKey && selectedKey[slotProps.node.key])
                                        ? 'text-orange-600'
                                        : ((slotProps.node.level === 0) ? 'text-indigo-600' : 'text-orange-600')
                                ]" 
                                class="text-base mr-2 transition-colors duration-200" 
                            />
                        </template>
                        <template #default="slotProps">
                            <span :class="selectedKey && selectedKey[slotProps.node.key] ? 'font-black text-orange-600' : 'font-bold text-gray-700'">
                                {{ slotProps.node.label }}
                            </span>
                        </template>
                    </Tree>
                </div>
            </div>
            
            <div class="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                <i class="pi pi-info-circle text-blue-500 mt-0.5" />
                <p class="text-xs text-blue-700 leading-relaxed">
                    Déplacer une famille changera son emplacement dans l'arborescence. Les sous-catégories enfants suivront automatiquement leur parent.
                </p>
            </div>
        </div>

        <!-- Footer Fixe avec style Orange -->
        <div class="shrink-0 border-t border-gray-200 bg-linear-to-r from-orange-50/50 to-orange-100/50 p-5">
            <div class="flex justify-between items-center gap-4">
                <Button 
                    :label="isMobileOrTablet ? '' : 'Placer à la racine'" 
                    icon="pi pi-home"
                    text
                    @click="onSetAsRoot" 
                    class="text-blue-700 font-bold text-xs p-3 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                    v-tooltip.top="isMobileOrTablet ? 'Placer à la racine' : ''"
                />
                <div class="flex gap-3">
                    <Button 
                        :label="isMobileOrTablet ? '' : 'Annuler'" 
                        icon="pi pi-times"
                        text 
                        @click="$emit('cancel')" 
                        class="px-5 py-2.5 font-bold rounded-xl text-gray-500 hover:bg-white hover:text-gray-700 transition-all border border-transparent shadow-xs"
                        v-tooltip.top="isMobileOrTablet ? 'Annuler' : ''"
                    />
                    <Button 
                        :label="isMobileOrTablet ? '' : 'Confirmer'" 
                        icon="pi pi-check" 
                        :disabled="!selectedKey" 
                        @click="onConfirm" 
                        :style="{ backgroundColor: '#FF7900', borderColor: '#FF7900' }" 
                        class="px-8 py-2.5 text-white font-bold border shadow-sm hover:shadow-orange-200/50 hover:shadow-lg transition-all active:scale-95 rounded-xl border-orange-600" 
                        v-tooltip.top="isMobileOrTablet ? 'Confirmer' : ''"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.p-tree) {
    border: none;
    background: transparent;
}
:deep(.p-tree-toggler) {
    color: #FF7900 !important;
}
:deep(.p-tree .p-treenode-content.p-highlight) {
    background: #FFF8F1;
    color: #FF7900;
}
:deep(.p-tree .p-treenode-content:focus) {
    box-shadow: inset 0 0 0 0.2rem #FF790020;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #ff7900;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #e56d00;
}
</style>
