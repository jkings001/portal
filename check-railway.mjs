// Railway GraphQL API - verificar status do banco MySQL
const TOKEN = 'a1e9818f-6b21-4953-99da-5dcb0f6380f4';
const API = 'https://backboard.railway.app/graphql/v2';

async function query(q, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query: q, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

// 1. Listar projetos
console.log('=== Projects ===');
const projects = await query(`
  query {
    projects {
      edges {
        node {
          id
          name
          createdAt
        }
      }
    }
  }
`);
console.log(JSON.stringify(projects, null, 2));

if (!projects?.projects?.edges?.length) {
  console.log('No projects found');
  process.exit(1);
}

// 2. Para cada projeto, listar serviços
for (const { node: project } of projects.projects.edges) {
  console.log(`\n=== Services in project: ${project.name} (${project.id}) ===`);
  
  const services = await query(`
    query($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              id
              name
              serviceInstances {
                edges {
                  node {
                    id
                    serviceId
                    environmentId
                    startCommand
                    domains {
                      serviceDomains {
                        domain
                      }
                      customDomains {
                        domain
                      }
                    }
                  }
                }
              }
            }
          }
        }
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `, { projectId: project.id });
  
  console.log(JSON.stringify(services, null, 2));
  
  // 3. Verificar variáveis de ambiente do MySQL
  const envs = services?.project?.environments?.edges || [];
  const svcs = services?.project?.services?.edges || [];
  
  for (const { node: svc } of svcs) {
    if (svc.name.toLowerCase().includes('mysql') || svc.name.toLowerCase().includes('db') || svc.name.toLowerCase().includes('database')) {
      console.log(`\n=== Variables for MySQL service: ${svc.name} ===`);
      
      for (const { node: env } of envs) {
        const vars = await query(`
          query($projectId: String!, $serviceId: String!, $environmentId: String!) {
            variables(projectId: $projectId, serviceId: $serviceId, environmentId: $environmentId)
          }
        `, { projectId: project.id, serviceId: svc.id, environmentId: env.id });
        
        console.log(`Environment: ${env.name}`);
        console.log(JSON.stringify(vars, null, 2));
      }
    }
  }
}
