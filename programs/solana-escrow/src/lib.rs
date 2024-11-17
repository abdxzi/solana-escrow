use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke;

// Declare the contract's ID
declare_id!("B3G5V8XLTyXVpM8txNJgdezuCJZrVq4y4zD1aVzezEvw");

#[program]
pub mod solana_escrow {
    use super::*;

    // Initialize the escrow account with a specified amount
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let client = &ctx.accounts.client;
    
        // Check that the client has enough SOL to fund the escrow
        require!(
            client.to_account_info().lamports() >= amount,
            EscrowError::InsufficientBalance
        );
    
        // Ensure amount is greater than zero
        require!(amount > 0, EscrowError::InvalidAmount);
    
        escrow.client = client.key();
        escrow.service_provider = Pubkey::default(); // No service provider initially
        escrow.amount = amount;
        escrow.client_approved = false;
        escrow.provider_approved = false;
        escrow.is_completed = false;
    
        // Transfer SOL from client to escrow account using system program
        invoke(
            &system_instruction::transfer(
                &client.key(),
                &escrow.to_account_info().key(),
                amount,
            ),
            &[
                client.to_account_info(),
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    
        // Emit an event that the escrow was initialized
        emit!(EscrowInitialized {
            escrow: escrow.key(),
            client: escrow.client,
            amount: escrow.amount,
        });
    
        Ok(())
    }

    // Accept a service provider for the escrow
    pub fn accept_service(
        ctx: Context<AcceptService>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let service_provider = &ctx.accounts.service_provider;

        // Ensure the escrow doesn't already have a service provider
        require!(
            escrow.service_provider == Pubkey::default(),
            EscrowError::ServiceAlreadyAccepted
        );

        // Set the service provider
        escrow.service_provider = service_provider.key();

        Ok(())
    }

    // Approve the completion of the escrow by either client or service provider
    pub fn approve_completion(
        ctx: Context<ApproveCompletion>,
        is_client: bool,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let signer_key = ctx.accounts.signer.key();
        
        // Ensure the escrow has been initialized with both client and service provider
        require!(
            escrow.client != Pubkey::default() && escrow.service_provider != Pubkey::default(),
            EscrowError::UninitializedEscrow
        );

        // Check if the signer is the client or the service provider
        if is_client {
            require!(
                signer_key == escrow.client,
                EscrowError::UnauthorizedSigner
            );
            escrow.client_approved = true;
        } else {
            require!(
                signer_key == escrow.service_provider,
                EscrowError::UnauthorizedSigner
            );
            escrow.provider_approved = true;
        }

        // If both parties approved, release funds
        if escrow.client_approved && escrow.provider_approved {
            // Transfer SOL from escrow to service provider
            **escrow.to_account_info().try_borrow_mut_lamports()? -= escrow.amount;
            **ctx.accounts.service_provider.try_borrow_mut_lamports()? += escrow.amount;

            escrow.is_completed = true;

            // Emit an event that the escrow is completed
            emit!(EscrowCompleted {
                escrow: escrow.key(),
                service_provider: escrow.service_provider,
                amount: escrow.amount,
            });
        }

        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = client, // The client pays for the transaction, but it's not a program account.
        space = 8 + 32 + 32 + 8 + 1 + 1 + 1 // Allocate enough space for the EscrowAccount struct
    )]
    pub escrow: Account<'info, EscrowAccount>, // The escrow account gets initialized here
    #[account(mut)]
    pub client: Signer<'info>, // The client must sign the transaction
    pub system_program: Program<'info, System>, // System program is required to create the new account
}

#[derive(Accounts)]
pub struct AcceptService<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    pub service_provider: Signer<'info>,
}

#[derive(Accounts)]
pub struct ApproveCompletion<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    /// CHECK: This account's address is checked against the stored service_provider in the escrow account
    #[account(mut)]
    pub service_provider: AccountInfo<'info>,
    pub signer: Signer<'info>,
}

// Escrow account data structure
#[account]
pub struct EscrowAccount {
    pub client: Pubkey,
    pub service_provider: Pubkey,
    pub amount: u64,
    pub client_approved: bool,
    pub provider_approved: bool,
    pub is_completed: bool,
}

// Define errors to handle edge cases and improve clarity
#[error_code]
pub enum EscrowError {
    #[msg("Service has already been accepted by another provider")]
    ServiceAlreadyAccepted,
    #[msg("Unauthorized signer for this operation")]
    UnauthorizedSigner,
    #[msg("Escrow account has not been initialized correctly")]
    UninitializedEscrow,
    #[msg("Insufficient balance in client account to initialize escrow")]
    InsufficientBalance,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
}

// Events to track important actions
#[event]
pub struct EscrowInitialized {
    pub escrow: Pubkey,
    pub client: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EscrowCompleted {
    pub escrow: Pubkey,
    pub service_provider: Pubkey,
    pub amount: u64,
}
