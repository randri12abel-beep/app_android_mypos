<script setup>
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import { ref, onMounted, onUnmounted } from 'vue';

const modelValue = defineModel();

const props = defineProps({
    isCreating: {
        type: Boolean,
        default: false
    },
    // Masquer le bouton de création de sous-famille si nécessaire
    hideSubButton: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['save', 'cancel', 'delete', 'create-sub', 'move']);

const isMobileOrTablet = ref(false);
// Détecter si l'écran est de type mobile ou tablette pour adapter l'UI
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
</script>

<template>
    <div class="flex flex-col h-full bg-white relative overflow-hidden">
        <!-- En-tête : Style inspiré de l'image de référence -->
        <div class="shrink-0 bg-[#FFF8F1] border-b border-gray-100">
            <div class="flex items-center justify-between px-6 py-4 flex-nowrap gap-4">
                <div class="flex flex-col min-w-0 flex-1">
                    <template v-if="!isCreating">
                        <!-- Libellé de mode discret (Détail uniquement) -->
                        <span class="text-[10px] font-black text-[#FF7900] uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 font-mono">
                            ✏️ MODIFIER FAMILLE
                        </span>
                        
                        <div class="flex items-center gap-3">
                            <!-- Badge d'initiale (Détail uniquement) -->
                            <div class="w-10 h-10 rounded-xl bg-linear-to-br from-[#FF7900] to-[#FF9B3F] flex items-center justify-center text-white text-xl font-black shadow-md border border-white/20 shrink-0">
                                {{ modelValue.name ? modelValue.name.charAt(0).toUpperCase() : 'C' }}
                            </div>
                            <!-- Titre : retour automatique à la ligne si trop long -->
                            <div class="flex flex-col">
                                <h2 class="text-xl md:text-2xl font-black text-[#1A1A1A] tracking-tight leading-tight wrap-break-word min-w-0 overflow-hidden">
                                    {{ modelValue.name || 'Sans nom' }}
                                </h2>
                                <!-- Indicateur Hiérarchique -->
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <span v-if="!modelValue.parent_id || modelValue.parent_id === 0" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                                         <i class="pi pi-box mr-2 text-indigo-600" />Famille Racine
                                    </span>
                                    <span v-else class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider flex items-center gap-1">
                                        <i class="pi pi-tag mr-2 text-orange-600" />Sous-famille de <span class="text-purple-800">{{ modelValue.parent_name || 'Inconnu' }}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <!-- Titre simple en mode création : retour à la ligne naturel -->
                        <h2 class="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-3 wrap-break-word min-w-0">
                            <span class="shrink-0">➕</span>
                            <span class="overflow-hidden">{{ modelValue.parent_name ? 'Nouvelle famille ' + modelValue.parent_name : 'Nouvelle Famille' }}</span>
                        </h2>
                    </template>
                </div>
                <!-- Style du bouton : icône seule sur mobile/tablette -->
                <div class="shrink-0 self-start mt-1">
                    <Button 
                        v-if="!isCreating && !hideSubButton"
                        :label="isMobileOrTablet ? '' : 'Ajouter sous-famille'"
                        icon="pi pi-plus"
                        @click="$emit('create-sub')"
                        :style="{ backgroundColor: '#FF7900', borderColor: '#FF7900' }"
                        class="text-white px-4 py-2 font-medium rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 border-0 whitespace-nowrap"
                        v-tooltip.bottom="isMobileOrTablet ? 'Ajouter sous-famille' : ''"
                    />
                </div>
            </div>
        </div>

        <!-- Corps de formulaire défilable -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div class="p-6 flex flex-col gap-8">
                <!-- Style de section : Tout en majuscules + barre orange -->
                <div class="space-y-4">
                    <h3 class="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-3">
                        <span class="w-1 h-4 bg-[#FF7900] rounded-full"></span>
                        Informations Principales
                    </h3>
                    
                    <div class="space-y-4">
                        <!-- Nom -->
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nom de la catégorie *</label>
                            <InputText 
                                v-model="modelValue.name" 
                                fluid 
                                placeholder="Ex: Électronique" 
                                class="p-3 border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            />
                        </div>

                        <!-- catID -->
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">catID *</label>
                            <InputNumber 
                                v-model="modelValue.catID" 
                                fluid 
                                :min="0"
                                :max="255"
                            />
                        </div>
                    </div>
                </div>

                <!-- Section Style matching image -->
                <div class="space-y-4">
                    <h3 class="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-3">
                        <span class="w-1 h-4 bg-[#FF7900] rounded-full"></span>
                        CONFIGURATION
                    </h3>
                    
                    <div class="space-y-5">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- État Vente -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">État (Vente)</label>
                                <div 
                                    class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-200"
                                    :class="modelValue.vente ? 'border-orange-400 bg-[#FFF8F1] shadow-sm' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'"
                                    @click="modelValue.vente = !modelValue.vente"
                                >
                                    <Checkbox v-model="modelValue.vente" binary />
                                    <span :class="modelValue.vente ? 'text-[#FF7900] font-bold' : 'text-gray-600'">
                                        {{ modelValue.vente ? '✓ Actif' : '○ Inactif' }}
                                    </span>
                                </div>
                            </div>

                            <!-- ESIM -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Support ESIM</label>
                                <div 
                                    class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-200"
                                    :class="modelValue.familles_esim ? 'border-orange-400 bg-[#FFF8F1] shadow-sm' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'"
                                    @click="modelValue.familles_esim = !modelValue.familles_esim"
                                >
                                    <Checkbox v-model="modelValue.familles_esim" binary />
                                    <span :class="modelValue.familles_esim ? 'text-[#FF7900] font-bold' : 'text-gray-600'">
                                        {{ modelValue.familles_esim ? 'Oui' : 'Non' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <!-- Stock -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                                <InputNumber v-model="modelValue.stock" showButtons :min="0" fluid />
                            </div>
                            <!-- Ordre -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Ordre</label>
                                <InputNumber v-model="modelValue.sort_order" showButtons :min="0" fluid />
                            </div>
                            <!-- Produits Vente -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Produits Vente</label>
                                <InputNumber v-model="modelValue.familles_produits_vente" :min="0" fluid />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                            <!-- Quota Staff -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Quota Staff</label>
                                <InputNumber v-model="modelValue.quota_staff" :min="0" fluid />
                            </div>
                            <!-- Quota Group -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Quota Group</label>
                                <InputNumber v-model="modelValue.quota_group" :min="0" fluid />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Codes -->
                <div class="space-y-4 pb-8">
                    <h3 class="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest flex items-center gap-3">
                        <span class="w-1 h-4 bg-[#FF7900] rounded-full"></span>
                        PARAMÈTRES TECHNIQUES
                    </h3>
                    
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="space-y-1">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Code CC</label>
                            <InputText v-model="modelValue.familles_cc" fluid class="text-sm rounded-lg" maxlength="1" />
                        </div>
                        <div class="space-y-1">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Code CV</label>
                            <InputText v-model="modelValue.familles_cv" fluid class="text-sm rounded-lg" maxlength="10" />
                        </div>
                        <div class="space-y-1">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Code CA</label>
                            <InputText v-model="modelValue.familles_ca" fluid class="text-sm rounded-lg" maxlength="4" />
                        </div>
                        <div class="space-y-1">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Code Cancel</label>
                            <InputText v-model="modelValue.familles_cancel_sale" fluid class="text-sm rounded-lg" maxlength="1" />
                        </div>
                        <div class="space-y-1">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Code SN</label>
                            <InputText v-model="modelValue.familles_sn" fluid class="text-sm rounded-lg" maxlength="1" />
                        </div>
                        <div class="space-y-1">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Catalogue</label>
                            <InputText v-model="modelValue.familles_catalog" fluid class="text-sm rounded-lg" maxlength="1" />
                        </div>
                        <div class="space-y-1">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Services</label>
                            <InputText v-model="modelValue.familles_services" fluid class="text-sm rounded-lg" maxlength="1" />
                        </div>
                        <div class="space-y-1">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Consignment</label>
                            <InputText v-model="modelValue.consignment" fluid class="text-sm rounded-lg" maxlength="1" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fixed Actions Footer -->
        <div class="shrink-0 border-t border-gray-200 bg-linear-to-r from-orange-50 to-orange-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div class="flex justify-between items-center px-6 py-4">
                <div class="flex gap-2">
                    <Button 
                        v-if="!isCreating"
                        icon="pi pi-trash" 
                        severity="danger" 
                        text 
                        rounded 
                        aria-label="Supprimer" 
                        @click="$emit('delete')"
                        class="hover:bg-red-100/50"
                    />
                </div>
                <div class="flex gap-3">
                    <Button 
                        v-if="!isCreating"
                        :label="isMobileOrTablet ? '' : 'Déplacer une famille'" 
                        icon="pi pi-directions"
                        severity="secondary" 
                        outlined
                        @click="$emit('move')"
                        class="px-4 border-orange-300 text-orange-700 hover:bg-orange-200/50 rounded-lg font-medium"
                        v-tooltip.top="isMobileOrTablet ? 'Déplacer une famille' : ''"
                    />
                    <Button 
                        v-else
                        :label="isMobileOrTablet ? '' : 'Annuler'" 
                        icon="pi pi-times"
                        text 
                        severity="danger" 
                        @click="$emit('cancel')"
                        class="px-5 text-red-600! hover:bg-red-50! rounded-lg font-bold"
                        v-tooltip.top="isMobileOrTablet ? 'Annuler' : ''"
                    />
                    <Button 
                        :label="isMobileOrTablet ? '' : 'Enregistrer'" 
                        icon="pi pi-check" 
                        @click="$emit('save')"
                        :style="{ backgroundColor: '#FF7900', borderColor: '#FF7900' }"
                        class="px-8 text-white font-bold border-0 shadow-sm hover:shadow-orange-200/50 hover:shadow-lg transition-all active:scale-95 rounded-lg"
                        v-tooltip.top="isMobileOrTablet ? 'Enregistrer' : ''"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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

.border-l-3 {
    border-left-width: 3px;
}
</style>
