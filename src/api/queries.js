// Consultas GraphQL usadas pelo widget (ver briefing, seção "Consultas GraphQL").

export const BOARD_STRUCTURE = `
  query Estrutura($boardIds: [ID!]) {
    boards(ids: $boardIds) {
      id
      name
      groups { id title position }
      columns { id title type }
    }
  }
`;

const COLUMN_VALUE_FIELDS = `
  id
  type
  text
  value
  ... on TimelineValue { from to }
  ... on DateValue { date }
`;

export const ITEMS_FIRST_PAGE = `
  query Itens($boardIds: [ID!], $colIds: [String!]) {
    boards(ids: $boardIds) {
      items_page(limit: 500) {
        cursor
        items {
          id
          name
          group { id }
          column_values(ids: $colIds) { ${COLUMN_VALUE_FIELDS} }
        }
      }
    }
  }
`;

export const ITEMS_NEXT_PAGE = `
  query Proxima($cursor: String!, $colIds: [String!]) {
    next_items_page(limit: 500, cursor: $cursor) {
      cursor
      items {
        id
        name
        group { id }
        column_values(ids: $colIds) { ${COLUMN_VALUE_FIELDS} }
      }
    }
  }
`;
