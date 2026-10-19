// Developer DTOs are opt-in reads, separate from the gameplay projection. The
// command path still resolves and validates current authority on every action.
export function createDeveloperProjectionPort({clientPort,project,siteNavigator}) {
  const getDeveloperReadModel=()=>Object.freeze({...clientPort.getReadModel(),developer:Object.freeze({siteNavigator:Object.freeze(project())})});
  return Object.freeze({...clientPort,
    getReadModel(options){return options?.includeDeveloper===false?clientPort.getReadModel():getDeveloperReadModel();},
    getDeveloperReadModel,siteNavigator
  });
}
