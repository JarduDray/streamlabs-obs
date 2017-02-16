import Vue from 'vue';
import Obs from '../../api/Obs.js';
import _ from 'lodash';

const state = {
  sources: {}
};

const mutations = {
  ADD_SOURCE(state, data) {
    Vue.set(state.sources, data.source.id, data.source);
  },

  REMOVE_SOURCE(state, data) {
    Vue.delete(state.sources, data.sourceId);
  },

  SET_SOURCE_PROPERTIES(state, data) {
    let source = state.sources[data.sourceId];

    source.properties = data.properties;
  },

  CREATE_PROPERTIES_RESTORE_POINT(state, data) {
    let source = state.sources[data.sourceId];

    source.restorePoint = _.cloneDeep(source.properties);
  }
};

const actions = {
  // node-obs does not currently support adding an existing
  // source to a scene. The state and mutations are set up
  // to support this in the future, but actions will match
  // the current capability of node-obs.
  createSourceAndAddToScene({ commit }, data) {
    Obs.createSource(
      data.sceneName,
      data.sourceType,
      data.sourceName
    );

    const properties = Obs.sourceProperties(data.sourceName, data.sourceId);

    commit('ADD_SOURCE', {
      source: {
        id: data.sourceId,
        name: data.sourceName,
        type: data.sourceType,
        properties,
        restorePoint: null
      }
    });

    commit('ADD_SOURCE_TO_SCENE', {
      sourceId: data.sourceId,
      sceneName: data.sceneName
    });
  },

  removeSource({ commit, state }, data) {
    let source = state.sources[data.sourceId];

    Obs.removeSource(source.name);

    commit('REMOVE_SOURCE', {
      sourceId: data.sourceId
    });

    commit('REMOVE_SOURCE_FROM_ALL_SCENES', {
      sourceId: data.sourceId
    });
  },

  refreshProperties({ commit, state }, data) {
    let source = state.sources[data.sourceId];

    commit('SET_SOURCE_PROPERTIES', {
      sourceId: data.sourceId,
      properties: Obs.sourceProperties(source.name, source.id)
    });
  },

  setSourceProperty({ dispatch, state }, data) {
    let source = state.sources[data.property.sourceId];

    Obs.setProperty(
      source.name,
      data.property.name,
      data.propertyValue
    );

    dispatch({
      type: 'refreshProperties',
      sourceId: data.property.sourceId
    });
  },

  createPropertiesRestorePoint({ commit }, data) {
    commit('CREATE_PROPERTIES_RESTORE_POINT', {
      sourceId: data.sourceId
    });
  },

  restoreProperties({ dispatch, state }, data) {
    let restorePoint = state.sources[data.sourceId].restorePoint;

    // TODO: Set each property in OBS

    dispatch({
      type: 'refreshProperties',
      sourceId: data.sourceId
    });
  }
};

const getters = {
  activeSource(state, getters) {
    if (getters.activeSourceId) {
      return state.sources[getters.activeSourceId];
    }
  },

  // Returns a function for fetching source properties
  sourceProperties(state) {
    return sourceId => {
      let source = state.sources[sourceId];

      if (source) {
        return source.properties;
      } else {
        return [];
      }
    };
  }
};

export default {
  state,
  mutations,
  actions,
  getters
};
