# Publish your SubQuery Project

## Benefits
- We'll run your SubQuery projects for you in a high performance, scalable, and managed public service
- This service is being provided to the community for free!
- You can make your projects public so that they'll be listed in the [SubQuery Explorer](https://explorer.subquery.network) and anyone around the world can view them
- We're integrated with GitHub, so anyone in your GitHub organisations will be able to view shared organisation projects

## Create your First Project

#### Login to SubQuery Projects

Before starting, please make sure that your SubQuery project is online in a public GitHub repository. The `schema.graphql` file must be in the root of your directory.

To create your first project, head to [project.subquery.network](https://project.subquery.network). You'll need to connect with your GitHub account to login.

![Projects Login](/assets/img/projects-dashboard.png)

SubQuery Projects is where you manage all your hosted projects uploaded to the SubQuery platform. You can create, delete, and even upgrade projects all from this application. If you have a GitHub organisations accounts connected, you can use the switcher on the header to change to between your personal account and your organisation account - projects created in an organisation account are shared between members in that GitHub organisation.
![Switch between GitHub accounts](/assets/img/projects-account-switcher.png)

#### Create your First Project

Lets start by clicking on "Create Project". You'll be taken to the New Project form. Please enter the following (you can change this in the future):
- **GitHub account:** If you have more than one GitHub accounts, select what account this project will be created under. Projects created in an GitHub organisation account are shared between members in that organisation.
- **Name**
- **Subtitle**
- **Description**
- **GitHub Repository URL:** This must be a valid GitHub URL to a public repository that has your SubQuery project. The `schema.graphql` file must be in the root of your directory ([learn more about the directory structure](/create/directory_structure)).
- **Hide project:** If selected, this will hide the project from the public SubQuery explorer. Keep this unselected if you want to share your SubQuery with the community!
![Create your first Project](/assets/img/projects-create.png)

Create your project and you'll see it on your SubQuery Project's list. *Now we just need to deploy a new version of it, we're almost there!*
![Created Project with no deployment](/assets/img/projects-no-deployment.png)

#### Deploy your first Version

While creating a project will setup the display behaviour of the project, you must deploy a version of it before it becomes operational. Deploying a version triggers a new SubQuery indexing operation to start, and sets up the required query service to start accepting GraphQL requests. You can also deploy new versions to existing projects here.

With your new project, you'll see a Deploy New Version button. Click this, and fill in the required information about the deployment:
- **Commit Hash of new Version:** From GitHub copy the full commit hash of the version of your SubQuery project codebase that you want deployed
- **Indexer Version:** This is the version of SubQuery's node service that you want to run this SubQuery on. See [`@subql/node`](https://www.npmjs.com/package/@subql/node)
- **Query Version:** This is the version of SubQuery's query service that you want to run this SubQuery on. See [`@subql/query`](https://www.npmjs.com/package/@subql/query)

![Deploy your first Project](/assets/img/projects-first-deployment.png)

If deployed successfully, you'll see the indexer start working and report back progress on indexing the current chain. This process may take time until it reaches 100%.

## Next Steps
Once your deployment has succeeded, connect to your SubQuery project in the SubQuery Explorer or via your GraphQL Endpoint. [Read how to here](/publish/connect)
