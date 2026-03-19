// Railway GraphQL API - verificar via token
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
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.log('Raw response:', text.slice(0, 500));
    return null;
  }
}

// 1. Verificar quem sou
console.log('=== Me ===');
const me = await query(`query { me { id name email } }`);
console.log(JSON.stringify(me, null, 2));

// 2. Tentar listar projetos com paginação
console.log('\n=== Projects (with pagination) ===');
const projects = await query(`
  query {
    projects(first: 20) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`);
console.log(JSON.stringify(projects, null, 2));
