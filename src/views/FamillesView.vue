<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from "primevue/usetoast";
import { FamillesService } from '@/services/FamillesService';
import FamillesTree from '@/components/familles/FamillesTree.vue';
import FamillesForm from '@/components/familles/FamillesForm.vue';
import ParentSelector from '@/components/familles/ParentSelector.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';

const toast = useToast();
const nodes = ref(null);
const selectedFamille = ref({}); // Affiché dans le panneau latéral desktop
const modalFamille = ref({});    // Affiché dans le formulaire modal
const isCreating = ref(false);
const showModal = ref(false); 
const showMoveModal = ref(false); // Modal pour le sélecteur de parent
const showConfirmMoveModal = ref(false); // Modal de confirmation finale
const showConfirmDeleteModal = ref(false);
const showConfirmSaveModal = ref(false);
const familyToMove = ref(null);   // La famille en cours de déplacement
const nodeToDelete = ref(null);   // Le nœud en cours de suppression
const targetParent = ref(null);   // La destination choisie
const isMobile = ref(false); 
const isTablet = ref(false); 
const isDesktop = ref(false); 
const orangeBrandColor = '#FF7900';

const checkScreenSize = () => {
    const width = window.innerWidth;
    isMobile.value = width < 768;
    isTablet.value = width >= 768 && width < 1024;
    isDesktop.value = width >= 1024;
};

onMounted(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    loadNodes();
});

onUnmounted(() => {
    window.removeEventListener('resize', checkScreenSize);
});

const loadNodes = async () => {
    const data = await FamillesService.getTreeTableNodes();
    nodes.value = data;
    
    // Auto-sélection de la première famille racine uniquement sur desktop si rien n'est sélectionné
    if (isDesktop.value && data && data.length > 0 && (!selectedFamille.value || Object.keys(selectedFamille.value).length === 0)) {
        const firstParent = data[0];
        if (firstParent && firstParent.data) {
            onUpdate(firstParent);
        }
    }
};

const openDialog = (famille, creating = false) => {
    isCreating.value = creating;
    if (creating) {
        modalFamille.value = { ...famille };
        // Valeurs par défaut pour la création
        if (!modalFamille.value.catID) modalFamille.value.catID = Math.floor(Math.random() * 255);
        modalFamille.value.sort_order = 1;
        modalFamille.value.familles_vente = true;
        showModal.value = true;
    } else {
        selectedFamille.value = { ...famille };
        if (isMobile.value || isTablet.value) {
            modalFamille.value = { ...famille };
            showModal.value = true;
        } else {
            showModal.value = false;
        }
    }
};

const onCreate = (node) => {
    // Créer une sous-famille (enfant)
    const parentId = node.data.key; // Le parent_id provient de la clé
    openDialog({ parent_id: parentId, type: 'Sous-Famille' }, true);
};

const onShow = (node) => {
    // Afficher les détails (actuellement redirige vers le mode modification)
    onUpdate(node);
};

const onUpdate = (node) => {
    const data = node.data; // Toutes les données du nœud d'arborescence
    const familleToEdit = {
        familles_id: data.familles_id || node.key,
        name: data.name || data.familles_name || '',
        familles_name: data.familles_name || data.name || '',
        stock: data.stock !== undefined ? data.stock : (data.familles_stock || 0),
        familles_stock: data.familles_stock || 0,
        vente: data.vente !== undefined ? data.vente : (data.familles_vente || false),
        familles_vente: data.familles_vente || false,
        sort_order: data.sort_order || 0,
        parent_id: data.parent_id || 0,
        parent_name: data.parent_name || '', // Récupéré de l'API Elixir
        catID: data.catID || 0,
        familles_esim: data.familles_esim || false,
        familles_cc: data.familles_cc || '',
        familles_cv: data.familles_cv || '',
        familles_ca: data.familles_ca || '',
        familles_cancel_sale: data.familles_cancel_sale || '',
        familles_sn: data.familles_sn || '',
        familles_catalog: data.familles_catalog || '',
        familles_services: data.familles_services || '',
        familles_produits_vente: data.familles_produits_vente || 0,
        quota_staff: data.quota_staff || 0,
        quota_group: data.quota_group || 0,
        consignment: data.consignment || ''
    };
    openDialog(familleToEdit, false);
};

const onDelete = (node) => {
    nodeToDelete.value = node;
    showConfirmDeleteModal.value = true;
};

const confirmDelete = async () => {
    const node = nodeToDelete.value;
    const activeFamille = showModal.value ? modalFamille.value : selectedFamille.value;
    const id = node ? node.key : activeFamille.familles_id;

    if (!id) return;

    try {
        await FamillesService.deleteFamille(id);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Famille supprimée', life: 3000 });
        showConfirmDeleteModal.value = false;
        showModal.value = false;
        nodeToDelete.value = null;
        if (isDesktop.value) {
            selectedFamille.value = {};
        }
        loadNodes();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la famille', life: 3000 });
    }
};

const onSave = async () => {
    const activeFamille = showModal.value ? modalFamille.value : selectedFamille.value;
    
    // Validation simple côté client
    if (!activeFamille.name && !activeFamille.familles_name) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Le nom de la catégorie est obligatoire', life: 3000 });
        return;
    }
    if (!activeFamille.catID) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Le catID est obligatoire', life: 3000 });
        return;
    }

    if (isCreating.value) {
        performSave();
    } else {
        showConfirmSaveModal.value = true;
    }
};

const performSave = async () => {
    const activeFamille = showModal.value ? modalFamille.value : selectedFamille.value;
    
    try {
        // Préparation du payload pour correspondre au schéma Elixir Famille.ex
        const payload = {
            familles_name: activeFamille.name || activeFamille.familles_name,
            parent_id: activeFamille.parent_id || 0,
            sort_order: activeFamille.sort_order || 0,
            catID: parseInt(activeFamille.catID),
            familles_esim: !!activeFamille.familles_esim,
            familles_vente: activeFamille.vente !== undefined ? activeFamille.vente : (activeFamille.familles_vente || false),
            familles_stock: activeFamille.stock !== undefined ? activeFamille.stock : (activeFamille.familles_stock || 0),
            familles_produits_vente: activeFamille.familles_produits_vente || 0,
            familles_cc: activeFamille.familles_cc || '',
            familles_cv: activeFamille.familles_cv || '',
            familles_ca: activeFamille.familles_ca || '',
            familles_cancel_sale: activeFamille.familles_cancel_sale || '',
            familles_sn: activeFamille.familles_sn || '',
            familles_catalog: activeFamille.familles_catalog || '',
            familles_services: activeFamille.familles_services || '',
            quota_staff: activeFamille.quota_staff || 0,
            quota_group: activeFamille.quota_group || 0,
            consignment: activeFamille.consignment || ''
        };

        if (isCreating.value) {
            const newFamille = await FamillesService.createFamille(payload);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Famille créée avec succès', life: 3000 });
            
            // Auto-sélection de la nouvelle famille
            const id = newFamille.familles_id;
            selectedFamille.value = { ...newFamille, name: newFamille.familles_name };
            selectedKey.value = { [id]: true };

            // Si c'est une sous-famille, on développe le parent
            if (newFamille.parent_id && newFamille.parent_id !== 0) {
                expandedKeys.value = { ...expandedKeys.value, [newFamille.parent_id]: true };
            }
        } else {
            const id = activeFamille.familles_id;
            const updatedFamille = await FamillesService.updateFamille(id, payload);
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Famille mise à jour avec succès', life: 3000 });
            
            // Mettre à jour selectedFamille si elle a été modifiée dans le modal
            if (showModal.value && !isCreating.value) {
                selectedFamille.value = { ...updatedFamille, name: updatedFamille.familles_name };
            }
        }
        showModal.value = false;
        showConfirmSaveModal.value = false;
        isCreating.value = false;
        await loadNodes(); // On attend le rechargement pour que l'arbre soit à jour
    } catch (error) {
        console.error("Erreur performSave:", error);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de l\'enregistrement', life: 3000 });
    }
};

const onCancel = () => {
    showModal.value = false;
    isCreating.value = false;
    modalFamille.value = {};
};

const onCreateSub = () => {
    const activeFamille = isDesktop.value && !showModal.value ? selectedFamille.value : modalFamille.value;
    const parentId = activeFamille.familles_id;
    const newSubFamille = {
        type: 'Sous-Famille',
        parent_id: parentId,
        parent_name: activeFamille.name || activeFamille.familles_name,
        name: '',
        catID: Math.floor(Math.random() * 255),
        vente: false,
        stock: 0,
        sort_order: 0,
        familles_esim: false
    };
    openDialog(newSubFamille, true);
};

const onDeleteFromForm = () => {
    nodeToDelete.value = null; // Indique que la suppression vient du formulaire/modal
    showConfirmDeleteModal.value = true;
};

const onReload = () => {
    loadNodes();
};

const onMoveRequest = () => {
    // Déclenché par le bouton "Déplacer" dans le formulaire
    familyToMove.value = showModal.value ? modalFamille.value : selectedFamille.value;
    showMoveModal.value = true;
};

const onParentSelected = (newParent) => {
    targetParent.value = newParent;
    showConfirmMoveModal.value = true;
};

const confirmMove = async () => {
    if (!familyToMove.value || !targetParent.value) return;

    try {
        const id = familyToMove.value.familles_id;
        const payload = {
            parent_id: targetParent.value.familles_id || 0
        };

        await FamillesService.updateFamille(id, payload);
        toast.add({ 
            severity: 'success', 
            summary: 'Déplacement réussi', 
            detail: `Famille déplacée vers : ${targetParent.value.name || 'Racine'}`, 
            life: 3000 
        });
        
        showConfirmMoveModal.value = false;
        showMoveModal.value = false;
        familyToMove.value = null;
        targetParent.value = null;
        
        await loadNodes();
        
        if (showModal.value) {
            showModal.value = false;
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de déplacer la famille', life: 3000 });
    }
};

const onNodeSelect = (node) => {
    if (node && node.data) {
        onUpdate(node);
    }
};
</script>

<template>
    <Toast />
    <!-- Clean Container -->
    <div class="min-h-screen bg-gray-50">
        <!-- Simplified Header with Orange branding -->
        <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Gestion des Familles</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Gérez vos catégories de produits</p>
                    </div>
                    <!-- Mobile : icône seule, Desktop : icône + texte -->
                    <Button 
                        @click="openDialog({ type: 'Famille' }, true)"
                        :icon="'pi pi-plus'"
                        :label="isMobile ? '' : 'Nouvelle Famille'"
                        :style="{ backgroundColor: orangeBrandColor, borderColor: orangeBrandColor }"
                        class="text-white font-medium border-0"
                    />
                </div>
            </div>
        </div>

        <!-- Two-Column Layout (Desktop) or Single Column (Mobile/Tablet) -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div :class="isDesktop ? 'grid grid-cols-5 gap-6' : 'block'">
                <!-- Tree Column -->
                <div :class="isDesktop ? 'col-span-2' : 'w-full'">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Arborescence des catégories</h2>
                        </div>
                        <div class="overflow-auto" :style="isDesktop ? 'max-height: calc(100vh - 250px);' : 'max-height: calc(100vh - 200px);'">
                            <FamillesTree 
                                :nodes="nodes" 
                                v-model:selectionKeys="selectedKey"
                                v-model:expandedKeys="expandedKeys"
                                @create="onCreate"
                                @show="onShow"
                                @update="onUpdate"
                                @delete="onDelete"
                                @reload="onReload"
                                @select="onNodeSelect"
                            />
                        </div>
                    </div>
                </div>

                <!-- Panneau de Détail (Desktop uniquement) -->
                <div v-if="isDesktop" class="col-span-3">
                    <!-- Afficher le formulaire quand une famille est sélectionnée -->
                    <div v-if="selectedFamille && Object.keys(selectedFamille).length > 0" 
                         class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col" 
                         style="height: calc(100vh - 200px);">
                        <FamillesForm 
                            v-model="selectedFamille"
                            :is-creating="false"
                            @save="onSave" 
                            @cancel="onCancel" 
                            @delete="onDeleteFromForm"
                            @create-sub="onCreateSub"
                            @move="onMoveRequest"
                        />
                    </div>
                    <!-- Message indicatif quand rien n'est sélectionné -->
                    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center" style="max-height: calc(100vh - 200px);">
                        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p class="text-gray-500 text-sm">Sélectionnez une famille pour voir ses détails</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal pour la création (tous écrans) ou détails (mobile/tablette uniquement) -->
        <Dialog 
            v-model:visible="showModal" 
            :modal="true"
            :style="{ width: isMobile ? '95vw' : '50vw' }"
            :contentStyle="{ height: '80vh', padding: '0' }"
            :dismissableMask="true"
            :showHeader="false"
            class="p-0 overflow-hidden"
            :pt="{ 
                root: { class: 'border-0 shadow-2xl rounded-xl overflow-hidden' },
                content: { class: 'p-0 overflow-hidden flex flex-col' } 
            }"
        >
            <FamillesForm 
                v-model="modalFamille"
                :is-creating="isCreating"
                @save="onSave" 
                @cancel="onCancel" 
                @delete="onDeleteFromForm"
                @create-sub="onCreateSub"
                @move="onMoveRequest"
            />
        </Dialog>

        <!-- Modal Sélecteur de Parent (Déplacement) -->
        <Dialog 
            v-model:visible="showMoveModal" 
            :modal="true"
            :showHeader="false"
            :style="{ width: isMobile ? '95vw' : '600px' }"
            :contentStyle="{ height: '70vh', padding: '0' }"
            :dismissableMask="true"
            class="p-0 overflow-hidden border-0 shadow-2xl rounded-xl"
        >
            <ParentSelector 
                :nodes="nodes" 
                :currentId="familyToMove?.familles_id"
                @select="onParentSelected"
                @cancel="showMoveModal = false"
            />
        </Dialog>

        <!-- Modal de Confirmation Finale de Déplacement -->
        <Dialog 
            v-model:visible="showConfirmMoveModal" 
            :modal="true"
            header="Confirmer"
            :style="{ width: isMobile ? '90vw' : '400px' }"
            :dismissableMask="true"
            class="rounded-xl shadow-2xl overflow-hidden"
        >
            <div class="px-6 py-4">
                <div class="flex items-start gap-4 mb-6">
                    <div class="shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <i class="pi pi-exclamation-circle text-xl" />
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-gray-900 leading-tight mb-1">
                            Déplacer cette famille ?
                        </h3>
                        <p class="text-xs text-gray-500 font-medium">
                            Vous allez déplacer <span class="text-orange-600 font-black">"{{ familyToMove?.name || familyToMove?.familles_name }}"</span> vers 
                            <span class="text-blue-700 font-black">{{ targetParent?.familles_id === 0 ? 'Racine' : targetParent?.name }}</span>.
                        </p>
                    </div>
                </div>

                <div class="flex gap-3 justify-end">
                    <Button 
                        :label="isMobile ? '' : 'Annuler'" 
                        icon="pi pi-times"
                        text 
                        @click="showConfirmMoveModal = false" 
                        class="px-5 font-bold rounded-lg text-gray-500 hover:bg-gray-100 border border-transparent"
                        v-tooltip.top="isMobile ? 'Annuler' : ''"
                    />
                    <Button 
                        :label="isMobile ? '' : 'Confirmer le mouvement'" 
                        icon="pi pi-check" 
                        @click="confirmMove" 
                        :style="{ backgroundColor: '#FF7900', borderColor: '#FF7900' }"
                        class="px-6 text-white font-bold border shadow-sm hover:shadow-orange-200/50 hover:shadow-lg transition-all active:scale-95 rounded-lg"
                        v-tooltip.top="isMobile ? 'Confirmer' : ''"
                    />
                </div>
            </div>
        </Dialog>

        <!-- Modal de Confirmation de Suppression -->
        <Dialog 
            v-model:visible="showConfirmDeleteModal" 
            :modal="true"
            header="Supprimer"
            :style="{ width: isMobile ? '90vw' : '400px' }"
            :dismissableMask="true"
            class="rounded-xl shadow-2xl overflow-hidden"
        >
            <div class="px-6 py-4">
                <div class="flex items-start gap-4 mb-6">
                    <div class="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <i class="pi pi-trash text-xl" />
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-gray-900 leading-tight mb-1">
                            Supprimer la famille ?
                        </h3>
                        <p class="text-xs text-gray-500 font-medium">
                            Cette action est <span class="text-red-600 font-black">irréversible</span>. 
                            La famille <span class="text-gray-900 font-bold">"{{ nodeToDelete?.data?.name || modalFamille?.name || selectedFamille?.name }}"</span> sera supprimée définitivement.
                        </p>
                    </div>
                </div>

                <div class="flex gap-3 justify-end">
                    <Button 
                        :label="isMobile ? '' : 'Annuler'" 
                        icon="pi pi-times"
                        text 
                        @click="showConfirmDeleteModal = false" 
                        class="px-5 font-bold rounded-lg text-gray-500 hover:bg-gray-100 border border-transparent"
                    />
                    <Button 
                        :label="isMobile ? '' : 'Supprimer définitivement'" 
                        icon="pi pi-trash" 
                        @click="confirmDelete" 
                        severity="danger"
                        class="px-6 font-bold border shadow-sm hover:shadow-lg transition-all active:scale-95 rounded-lg"
                    />
                </div>
            </div>
        </Dialog>

        <!-- Modal de Confirmation de Modification -->
        <Dialog 
            v-model:visible="showConfirmSaveModal" 
            :modal="true"
            header="Enregistrer"
            :style="{ width: isMobile ? '90vw' : '400px' }"
            :dismissableMask="true"
            class="rounded-xl shadow-2xl overflow-hidden"
        >
            <div class="px-6 py-4">
                <div class="flex items-start gap-4 mb-6">
                    <div class="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <i class="pi pi-save text-xl" />
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-gray-900 leading-tight mb-1">
                            Enregistrer les modifications ?
                        </h3>
                        <p class="text-xs text-gray-500 font-medium">
                            Voulez-vous valider les changements apportés à cette catégorie ?
                        </p>
                    </div>
                </div>

                <div class="flex gap-3 justify-end">
                    <Button 
                        :label="isMobile ? '' : 'Annuler'" 
                        icon="pi pi-times"
                        text 
                        @click="showConfirmSaveModal = false" 
                        class="px-5 font-bold rounded-lg text-gray-500 hover:bg-gray-100 border border-transparent"
                    />
                    <Button 
                        :label="isMobile ? '' : 'Confirmer les changements'" 
                        icon="pi pi-check" 
                        @click="performSave" 
                        :style="{ backgroundColor: '#FF7900', borderColor: '#FF7900' }"
                        class="px-6 text-white font-bold border shadow-sm hover:shadow-orange-200/50 hover:shadow-lg transition-all active:scale-95 rounded-lg"
                    />
                </div>
            </div>
        </Dialog>
    </div>
</template>
