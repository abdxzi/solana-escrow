This Solana Escrow Contract works as a middleman between a client and a service provider to ensure safe transactions. The client deposits funds into an escrow account, and the service provider can accept and complete the service. Once both parties approve, the funds are transferred to the service provider.


# Workflow

1. Initialize the Escrow: \
The client deposits a certain amount of SOL into the escrow account.
    - The client’s wallet is checked to ensure they have enough funds.
    - The client_approved and provider_approved flags are set to false, indicating no approvals yet.
2. Service Provider Accepts the Job: \
    The service provider can accept the job.

    - The provider needs to confirm the job by calling the accept_service function.
    - This function ensures that no other provider has already accepted the service.
3. Both Parties Approve Completion: \
    Once the service is completed, the client and the service provider must approve the service completion.

    - The client calls approve_completion(is_client = true) to approve the service from their side.
    - The service provider calls approve_completion(is_client = false) to approve the service from their side.
4. Release the Funds:  \
    If both the client and the service provider approve the service, the escrow contract releases the funds:

    - The funds are transferred from the escrow account to the service provider’s wallet.
    - The contract marks the escrow as completed.


# Deployment

```bash
anchor build
solana program deploy target/deploy/<program-name>.so
solana program show <PROGRAM_ID>
```
add program id to anchor.toml
```toml
[programs.devnet]
<program-name> = "<new_program_id>"
```
Switch to the devnet in your Anchor.toml file:
```
cluster = "devnet"
```
```bash
anchor test --provider.cluster devnet
```

interact:
```bash
solana program invoke --program-id <PROGRAM_ID> --keypair ~/.config/solana/id.json
```