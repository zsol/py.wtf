import useFetchProject from "./fetchProject";

const useFetchModule = (projectName: string, moduleName: string) => {
  const { project, projectJsonUrl, error, isLoading } =
    useFetchProject(projectName);

  return {
    isLoading,
    error,
    project,
    projectJsonUrl,
    module: project
      ? project.modules.find((mod) => mod.name === moduleName)
      : undefined,
  };
};

export default useFetchModule;
