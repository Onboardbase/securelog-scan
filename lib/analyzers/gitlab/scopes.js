const gitlabScopes = {
  api: "Grants complete read/write access to the API, including all groups and projects, the container registry, the dependency proxy, and the package registry.",
  read_api:
    "Grants read access to the API, including all groups and projects, the container registry, and the package registry.",
  read_user:
    "Grants read-only access to your profile through the /user API endpoint, which includes username, public email, and full name. Also grants access to read-only API endpoints under /users.",
  create_runner: "Grants create access to the runners.",
  manage_runner: "Grants access to manage the runners.",
  k8s_proxy:
    "Grants permission to perform Kubernetes API calls using the agent for Kubernetes.",
  read_repository:
    "Grants read-only access to repositories on private projects using Git-over-HTTP or the Repository Files API.",
  write_repository:
    "Grants read-write access to repositories on private projects using Git-over-HTTP (not using the API).",
  read_registry:
    "Grants read-only access to container registry images on private projects.",
  write_registry:
    "Grants write access to container registry images on private projects. You need both read and write access to push images.",
  ai_features: "Grants access to GitLab Duo related API endpoints.",
};

module.exports = { gitlabScopes };
