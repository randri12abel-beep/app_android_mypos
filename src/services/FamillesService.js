import axios from 'axios';

// URL de base de l'API Elixir/Phoenix
const API_URL = 'http://localhost:4000/api/familles';

export const FamillesService = {
  /**
   * Récupère l'arborescence complète des familles pour le composant TreeTable.
   * @returns {Promise<Array>} Liste des nœuds hiérarchiques.
   */
  async getTreeTableNodes() {
    try {
      const response = await axios.get(API_URL);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du chargement des familles', error);
      return [];
    }
  },

  /**
   * Crée une nouvelle famille ou sous-famille.
   * @param {Object} famille - Les données de la famille à créer.
   * @returns {Promise<Object>} La famille créée.
   */
  async createFamille(famille) {
    try {
      const response = await axios.post(API_URL, famille);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création de la famille', error);
      throw error;
    }
  },

  /**
   * Met à jour une famille existante.
   * @param {number|string} id - L'identifiant de la famille.
   * @param {Object} famille - Les nouvelles données de la famille.
   * @returns {Promise<Object>} La famille mise à jour.
   */
  async updateFamille(id, famille) {
    try {
      // Le backend attend les paramètres enveloppés : { "famille": { ... } }
      const response = await axios.put(`${API_URL}/${id}`, { famille: famille });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la famille', error);
      throw error;
    }
  },

  /**
   * Supprime une famille définitivement.
   * @param {number|string} id - L'identifiant de la famille à supprimer.
   */
  async deleteFamille(id) {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la famille', error);
      throw error;
    }
  }
}
