use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;
use std::mem::size_of;

declare_id!("9q4dShPZCBvfMiv3FXugJbwKKUsJS7cTnn2YHgkUUTvC");

pub const ESCROW_SEED: &[u8] = b"solanatestescrow";

#[program]
pub mod solana_escrow {

    use super::*;

    // Initialize the escrow account with a specified amount
    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, amount: u64, metadata: [u8; 34]) -> Result<()> {
        let client = &ctx.accounts.client;
        let escrow = &mut ctx.accounts.escrow;

        // Checks
        require!(
            client.to_account_info().lamports() >= amount,
            EscrowError::InsufficientBalance
        );

        require!(amount > 0, EscrowError::InvalidAmount);

        let (_pda, bump) =
            Pubkey::find_program_address(&[ESCROW_SEED, client.key().as_ref()], ctx.program_id);

        escrow.bump = bump;
        escrow.client = ctx.accounts.client.key();
        escrow.service_provider = Pubkey::default();
        escrow.amount = amount;
        escrow.client_approved = false;
        escrow.is_completed = false;
        escrow.metadata = metadata;

        // Transfer SOL from client to escrow account using system program
        invoke(
            &system_instruction::transfer(&client.key(), &escrow.to_account_info().key(), amount),
            &[
                client.to_account_info(),
                escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Emit the initialization event
        emit!(EscrowInitialized {
            escrow: escrow.key(),
            client: client.key(),
            amount,
        });

        Ok(())
    }

    // Accept a service provider for the escrow
    pub fn accept_service(ctx: Context<AcceptService>) -> Result<()> {
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
    pub fn approve_completion(ctx: Context<ApproveCompletion>) -> Result<()> {
        let escrow: &mut Account<'_, EscrowAccount> = &mut ctx.accounts.escrow;
        let signer_key = ctx.accounts.client.key();

        require!(
            escrow.service_provider != Pubkey::default(),
            EscrowError::UninitializedEscrow
        );

        require!(signer_key == escrow.client, EscrowError::UnauthorizedSigner);

        escrow.client_approved = true;

        Ok(())
    }

    pub fn release_fund(ctx: Context<ReleaseFund>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let service_provider = &ctx.accounts.service_provider;

        require!(
            service_provider.key() == escrow.service_provider,
            EscrowError::UnauthorizedSigner
        );

        require!(escrow.client_approved, EscrowError::NotApprovedForRealease);
        require!(!escrow.is_completed, EscrowError::EscrowAlreadyCompleted);

        escrow.is_completed = true;
        // let service_provider = ctx.accounts.service_provider.to_account_info();

        // @note - Below two methods of transafer wont work because our ecrow account have data with it.

        // let ix = system_instruction::transfer(
        //     &escrow.key(),
        //     &service_provider.key(),
        //     ctx.accounts.escrow.amount,
        // );

        // invoke_signed(
        //     &ix,
        //     &[
        //         ctx.accounts.escrow.to_account_info(),
        //         ctx.accounts.service_provider.to_account_info(),
        //         ctx.accounts.system_program.to_account_info(),
        //     ],
        //     &[&[ESCROW_SEED, ctx.accounts.escrow.client.key().as_ref(), &[ctx.accounts.escrow.bump]]],
        // )?;

        // let client_key = escrow.client.key();
        // let signer_seeds: &[&[&[u8]]] =
        //     &[&[ESCROW_SEED.as_ref(), client_key.as_ref(), &[escrow.bump]]];

        // let cpi_context = CpiContext::new_with_signer(
        //     ctx.accounts.system_program.to_account_info(),
        //     Transfer {
        //         from: escrow.to_account_info(),
        //         to: service_provider.to_account_info(),
        //     },
        //     signer_seeds,
        // );

        // transfer(cpi_context, escrow.amount)?;

        // let transfer_amount = escrow.amount;

        // @note - Same as below

        // **ctx
        //     .accounts
        //     .service_provider
        //     .to_account_info()
        //     .try_borrow_mut_lamports()? += transfer_amount;
        // **ctx
        //     .accounts
        //     .escrow
        //     .to_account_info()
        //     .try_borrow_mut_lamports()? -= transfer_amount;

        // Sent lamports except rent fee else it will destroy account
        let lamports = escrow.get_lamports();
        let rent_exempt_balance = Rent::get()?.minimum_balance(size_of::<EscrowAccount>() + 20);
        let remaining_lamports = lamports.saturating_sub(rent_exempt_balance);
        if remaining_lamports > 0 {
            ctx.accounts.escrow.sub_lamports(remaining_lamports)?;
            ctx.accounts
                .service_provider
                .add_lamports(remaining_lamports)?;
        } else {
            return Err(EscrowError::InsufficientBalance)?;
        }

        Ok(())
    }

    pub fn close_escrow(ctx: Context<CloseEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let client = &mut ctx.accounts.client;
        
        require!(
            client.key() == escrow.client,
            EscrowError::UnauthorizedSigner
        );

        Ok(())
    }
}


// Account structures
#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = client,
        // space = 8 + 32 + 32 + 8 + 1 + 1, 
        space = size_of::<EscrowAccount>() + 16, // +16 for internal overhead
        seeds = [b"solanatestescrow", client.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub client: Signer<'info>,

    pub system_program: Program<'info, System>,
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
    pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseFund<'info> {
    // #[account(mut, close = service_provider)] // @note - if this on function cal will destroy account and send all sol to service_provider
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub service_provider: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseEscrow<'info> {
    #[account(
        mut,
        close = client// Transfers remaining lamports to the creator
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub client: Signer<'info>,
}

// Escrow account data structure
#[account]
pub struct EscrowAccount {
    pub client: Pubkey,
    pub service_provider: Pubkey,
    pub amount: u64,
    pub client_approved: bool,
    pub is_completed: bool,
    pub bump: u8,
    pub metadata: [u8; 34],
}

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
    #[msg("Client must approve Completion to withdraw funds")]
    NotApprovedForRealease,
    #[msg("Escrow already completed")]
    EscrowAlreadyCompleted,
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
