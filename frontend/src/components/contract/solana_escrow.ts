/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solana_escrow.json`.
 */
export type SolanaEscrow = {
  "address": "3SgbiXdLJ81n1r5HR42fbHGWfQM3Djds6kfyYPeNQUKs",
  "metadata": {
    "name": "solanaEscrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acceptService",
      "discriminator": [
        254,
        51,
        138,
        57,
        189,
        26,
        24,
        118
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "serviceProvider",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "approveCompletion",
      "discriminator": [
        191,
        196,
        91,
        103,
        232,
        146,
        6,
        67
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "client",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeEscrow",
      "discriminator": [
        243,
        160,
        77,
        153,
        11,
        92,
        48,
        209
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108,
                  97,
                  110,
                  97,
                  116,
                  101,
                  115,
                  116,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "client"
              }
            ]
          }
        },
        {
          "name": "client",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "releaseFund",
      "discriminator": [
        93,
        20,
        135,
        230,
        79,
        227,
        89,
        113
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "serviceProvider",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrowAccount",
      "discriminator": [
        36,
        69,
        48,
        18,
        128,
        225,
        125,
        135
      ]
    }
  ],
  "events": [
    {
      "name": "escrowCompleted",
      "discriminator": [
        229,
        26,
        0,
        202,
        140,
        167,
        106,
        187
      ]
    },
    {
      "name": "escrowInitialized",
      "discriminator": [
        222,
        186,
        157,
        47,
        145,
        142,
        176,
        248
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "serviceAlreadyAccepted",
      "msg": "Service has already been accepted by another provider"
    },
    {
      "code": 6001,
      "name": "unauthorizedSigner",
      "msg": "Unauthorized signer for this operation"
    },
    {
      "code": 6002,
      "name": "uninitializedEscrow",
      "msg": "Escrow account has not been initialized correctly"
    },
    {
      "code": 6003,
      "name": "insufficientBalance",
      "msg": "Insufficient balance in client account to initialize escrow"
    },
    {
      "code": 6004,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6005,
      "name": "notApprovedForRealease",
      "msg": "Client must approve Completion to withdraw funds"
    },
    {
      "code": 6006,
      "name": "escrowAlreadyCompleted",
      "msg": "Escrow already completed"
    }
  ],
  "types": [
    {
      "name": "escrowAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "client",
            "type": "pubkey"
          },
          {
            "name": "serviceProvider",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "clientApproved",
            "type": "bool"
          },
          {
            "name": "isCompleted",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "escrowCompleted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "serviceProvider",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "escrowInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "client",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
