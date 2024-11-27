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
```

add program id to anchor.toml
```toml
[programs.devnet]
solana_escrow = <PROGRAM_ID>
```

Switch to the devnet in your Anchor.toml file:
```
cluster = "devnet"
```

Change RPC url to devnet
```
solana config set --url d
```

Check PubKey included in `target/deploy/solana_escrow-keypair.json`
```bash
anchor keys list

# generate new if this address is already in devnet
rm target/deploy/solana_escrow-keypair.json
anchor keys list

anchor keys sync # updates the program id in anchor.toml devnet
```

If we want to change deploy wallet 

```bash
solana-keygen new -o id.json
solana account ./id.json
solana balance ./id.json
 solana airdrop 4 id.json
# upadte wallet part in Anchor.toml to `./id.json`
```

Deploy:
```bash
anchor deploy
```

<details>
<summary>Deployment Fail 1</summary>

```
anchor deploy --provider.cluster devnet
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: ./id.json
Deploying program "solana_escrow"...
Program path: /home/abdxzi/Zi/work/solana-escrow/anchor_project/target/deploy/solana_escrow.so...
=================================================================================
Recover the intermediate account's ephemeral keypair file with
`solana-keygen recover` and the following 12-word seed phrase:
=================================================================================
cloth skull install sibling just chest garbage endorse prison drift cross tornado
=================================================================================
To resume a deploy, pass the recovered keypair as the
[BUFFER_SIGNER] to `solana program deploy` or `solana program write-buffer'.
Or to recover the account's lamports, pass it as the
[BUFFER_ACCOUNT_ADDRESS] argument to `solana program close`.
=================================================================================
Error: 3 write transactions failed
There was a problem deploying: Output { status: ExitStatus(unix_wait_status(256)), stdout: "", stderr: "" }.
```

### Solution
```bash
solana-keygen recover -o buffer-keypair.json
# enter keyphrase from console
solana program deploy --buffer buffer-keypair.json --upgrade-authority id.json
```
</details>



```bash
anchor test --provider.cluster devnet
```

interact:
```bash
solana program invoke --program-id <PROGRAM_ID> --keypair ~/.config/solana/id.json
```