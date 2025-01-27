// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

export default {
  rpc: {
    mt: {
      treeLeaves: {
        description: 'Query for the tree leaves',
        params: [
          {
            isOptional: false,
            name: 'tree_id',
            type: 'u32'
          },
          {
            isOptional: false,
            name: 'from',
            type: 'u32'
          },
          {
            isOptional: false,
            name: 'to',
            type: 'u32'
          },
          {
            isOptional: false,
            name: 'at',
            type: 'Hash'
          }
        ],
        type: 'Vec<[u8; 32]>'
      }
    }
  },
  types: {
    KeyId: 'u32',
    TreeId: 'u32'
  },
  typesAlias: {}
};
