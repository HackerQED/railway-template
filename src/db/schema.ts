import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	normalizedEmail: text('normalized_email').unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	role: text('role'),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	customerId: text('customer_id'),
}, (table) => ({
	userIdIdx: index("user_id_idx").on(table.id),
	userCustomerIdIdx: index("user_customer_id_idx").on(table.customerId),
	userRoleIdx: index("user_role_idx").on(table.role),
}));

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
}, (table) => ({
	sessionTokenIdx: index("session_token_idx").on(table.token),
	sessionUserIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
}, (table) => ({
	accountUserIdIdx: index("account_user_id_idx").on(table.userId),
	accountAccountIdIdx: index("account_account_id_idx").on(table.accountId),
	accountProviderIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const payment = pgTable("payment", {
	id: text("id").primaryKey(),
	priceId: text('price_id').notNull(),
	type: text('type').notNull(),
	scene: text('scene'), // payment scene: 'lifetime', 'credit', 'subscription'
	interval: text('interval'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(),
	subscriptionId: text('subscription_id'),
	sessionId: text('session_id'),
	invoiceId: text('invoice_id').unique(), // unique constraint for avoiding duplicate processing
	status: text('status').notNull(),
	paid: boolean('paid').notNull().default(false), // indicates whether payment is completed (set in invoice.paid event)
	periodStart: timestamp('period_start'),
	periodEnd: timestamp('period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	trialStart: timestamp('trial_start'),
	trialEnd: timestamp('trial_end'),
	metadata: jsonb("metadata"), // { conversionReportedAt, ... }
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	paymentTypeIdx: index("payment_type_idx").on(table.type),
	paymentSceneIdx: index("payment_scene_idx").on(table.scene),
	paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
	paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
	paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
	paymentStatusIdx: index("payment_status_idx").on(table.status),
	paymentPaidIdx: index("payment_paid_idx").on(table.paid),
	paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
	paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
	paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

export const userCredit = pgTable("user_credit", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	balance: integer("balance").notNull().default(0), // purchased credits (packages, register gift)
	subscriptionBalance: integer("subscription_balance").notNull().default(0), // monthly subscription/lifetime credits (resets on renewal)
	pendingBalance: integer("pending_balance").notNull().default(0), // locked credits during generation (pre-deduction)
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
}));

export const creditTransaction = pgTable("credit_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text("type").notNull(),
	description: text("description"),
	amount: integer("amount").notNull(), // positive for earn, negative for spend
	paymentId: text("payment_id"), // associated invoice ID
	generationId: text("generation_id").references(() => generation.id, { onDelete: 'set null' }),
	metadata: jsonb("metadata"), // breakdown: { fromSubscription, fromBalance }
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
	creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
	creditTransactionGenerationIdIdx: index("credit_transaction_generation_id_idx").on(table.generationId),
}));

export const project = pgTable("project", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	title: text("title").notNull(),
	status: text("status").notNull().default('active'), // 'active' | 'completed' | 'archived'
	metadata: jsonb("metadata"), // extensible info (music URL, style description, etc.)
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	projectUserIdIdx: index("project_user_id_idx").on(table.userId),
	projectStatusIdx: index("project_status_idx").on(table.status),
}));

export const generation = pgTable("generation", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text("type").notNull(), // 'image' | 'video'
	generatorId: text("generator_id").notNull(), // external display id, e.g. 'seedream-4-5', 'veo-3-1'
	innerProvider: text("inner_provider").notNull(), // NEVER expose — worker routing key, e.g. 'kie', 'kie-veo'
	innerModelId: text("inner_model_id"), // NEVER expose — audit variant, e.g. 'kie-seedream-4.5-t2i'
	innerProviderTaskId: text("inner_provider_task_id"), // NEVER expose — upstream task id
	status: text("status").notNull().default('pending'), // 'pending' | 'processing' | 'done' | 'failed'
	input: jsonb("input"), // { prompt, params... }
	output: jsonb("output"), // { url, width, height, duration... }
	error: jsonb("error"), // { code, message }
	innerProviderCost: numeric("inner_provider_cost"), // NEVER expose — upstream cost in cents

	projectId: text("project_id").references(() => project.id, { onDelete: 'set null' }),
	comment: text("comment"),
	sortOrder: integer("sort_order"),
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	generationUserIdIdx: index("generation_user_id_idx").on(table.userId),
	generationTypeIdx: index("generation_type_idx").on(table.type),
	generationGeneratorIdIdx: index("generation_generator_id_idx").on(table.generatorId),
	generationInnerProviderIdx: index("generation_inner_provider_idx").on(table.innerProvider),
	generationStatusIdx: index("generation_status_idx").on(table.status),
	generationProjectIdIdx: index("generation_project_id_idx").on(table.projectId),
	generationCreatedAtIdx: index("generation_created_at_idx").on(table.createdAt),
}));

export const preview = pgTable("preview", {
	id: text("id").primaryKey(),
	projectId: text("project_id").notNull().unique().references(() => project.id, { onDelete: 'cascade' }),
	blocks: jsonb("blocks").notNull(), // Block[]
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	previewProjectIdIdx: index("preview_project_id_idx").on(table.projectId),
}));

export const userConversion = pgTable("user_conversion", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: 'cascade' }),

	// Conversion timestamps
	signUpAt: timestamp("sign_up_at"),
	purchaseAt: timestamp("purchase_at"), // first purchase time
	purchaseAmountCents: integer("purchase_amount_cents").notNull().default(0), // cumulative total

	// Attribution data (captured on first visit)
	gclid: text("gclid"), // Google Ads click ID
	utmSource: text("utm_source"),
	utmCampaign: text("utm_campaign"),
	referrer: text("referrer"),
	landingPage: text("landing_page"),

	// Pending purchase reports (written by webhook, consumed by frontend)
	// [{transactionId, value, currency, createdAt, reportedAt}]
	pendingPurchaseReports: jsonb("pending_purchase_reports"),

	// Extension field
	metadata: jsonb("metadata"),

	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	userConversionUserIdIdx: index("user_conversion_user_id_idx").on(table.userId),
	userConversionSignUpAtIdx: index("user_conversion_sign_up_at_idx").on(table.signUpAt),
	userConversionPurchaseAtIdx: index("user_conversion_purchase_at_idx").on(table.purchaseAt),
	userConversionGclidIdx: index("user_conversion_gclid_idx").on(table.gclid),
	userConversionUtmSourceIdx: index("user_conversion_utm_source_idx").on(table.utmSource),
	userConversionLandingPageIdx: index("user_conversion_landing_page_idx").on(table.landingPage),
}));

export const apiKey = pgTable("api_key", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	keyHash: text("key_hash").notNull(),
	keyPrefix: text("key_prefix").notNull(), // first 8 chars for display
	name: text("name").notNull(),
	lastUsedAt: timestamp("last_used_at"),
	revokedAt: timestamp("revoked_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
	apiKeyUserIdIdx: index("api_key_user_id_idx").on(table.userId),
	apiKeyHashIdx: index("api_key_hash_idx").on(table.keyHash),
}));
