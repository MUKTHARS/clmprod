
DROP TABLE IF EXISTS public.user_notifications CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.comment_attachments CASCADE;
DROP TABLE IF EXISTS public.comment_reactions CASCADE;
DROP TABLE IF EXISTS public.comment_tags CASCADE;
DROP TABLE IF EXISTS public.review_comments CASCADE;
DROP TABLE IF EXISTS public.contract_deliverables CASCADE;
DROP TABLE IF EXISTS public.contract_versions CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.contract_permissions CASCADE;
DROP TABLE IF EXISTS public.amendment_comparisons CASCADE;
DROP TABLE IF EXISTS public.extraction_logs CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.extraction_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.amendment_comparisons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.contract_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.contract_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.review_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.comment_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.comment_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.comment_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.contract_deliverables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.user_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create users table
CREATE TABLE public.users (
    id integer NOT NULL DEFAULT nextval('public.users_id_seq'::regclass),
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100),
    role character varying(20) DEFAULT 'project_manager'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone,
    is_active boolean DEFAULT true,
    department character varying(100),
    phone character varying(20),
    first_name character varying,
    last_name character varying,
    company character varying,
    user_type character varying DEFAULT 'internal'::character varying,
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_username_key UNIQUE (username)
);

-- Create user_sessions table
CREATE TABLE public.user_sessions (
    id integer NOT NULL DEFAULT nextval('public.user_sessions_id_seq'::regclass),
    user_id integer NOT NULL,
    session_token character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    ip_address character varying(45),
    user_agent text,
    CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT user_sessions_session_token_key UNIQUE (session_token),
    CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create extraction_logs table
CREATE TABLE public.extraction_logs (
    id integer NOT NULL DEFAULT nextval('public.extraction_logs_id_seq'::regclass),
    contract_id integer,
    extraction_type character varying,
    field_name character varying,
    extracted_value text,
    confidence_score double precision,
    "timestamp" timestamp with time zone DEFAULT now(),
    parent_contract_id integer,
    previous_value text,
    CONSTRAINT extraction_logs_pkey PRIMARY KEY (id)
);

-- Create contracts table
CREATE TABLE public.contracts (
    id integer NOT NULL DEFAULT nextval('public.contracts_id_seq'::regclass),
    filename character varying NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    investment_id character varying(255),
    project_id character varying(255),
    grant_id character varying(255),
    extracted_reference_ids jsonb DEFAULT '[]'::jsonb,
    contract_number character varying,
    grant_name character varying,
    grantor character varying,
    grantee character varying,
    total_amount double precision,
    start_date character varying,
    end_date character varying,
    purpose text,
    payment_schedule jsonb,
    terms_conditions jsonb,
    comprehensive_data jsonb,
    full_text text,
    status character varying DEFAULT 'draft'::character varying,
    processing_time double precision,
    chroma_id character varying(255),
    document_type character varying DEFAULT 'main_contract'::character varying,
    parent_contract_id integer,
    version integer DEFAULT 1,
    is_latest_version boolean DEFAULT true,
    amendment_status character varying DEFAULT 'draft'::character varying,
    amendment_date timestamp with time zone,
    amendment_reason text,
    created_by integer,
    review_comments text DEFAULT ''::text,
    review_status character varying(50) DEFAULT 'pending_review'::character varying,
    review_summary text,
    forwarded_by integer,
    forwarded_at timestamp with time zone,
    program_manager_recommendation character varying(20),
    director_decision_status character varying(20),
    director_decision_comments text,
    director_decided_at timestamp with time zone,
    director_decided_by integer,
    business_sign_off boolean DEFAULT false,
    risk_accepted boolean DEFAULT false,
    is_locked boolean DEFAULT false,
    lock_reason text,
    updated_at timestamp with time zone DEFAULT now(),
    assigned_pm_users jsonb DEFAULT '[]'::jsonb,
    assigned_pgm_users jsonb DEFAULT '[]'::jsonb,
    assigned_director_users jsonb DEFAULT '[]'::jsonb,
    additional_documents jsonb DEFAULT '[]'::jsonb,
    notes text,
    agreement_type character varying,
    effective_date character varying,
    renewal_date character varying,
    termination_date character varying,
    jurisdiction character varying,
    governing_law character varying,
    special_conditions jsonb,
    last_edited_by integer,
    last_edited_at timestamp with time zone,
    published_at timestamp with time zone,
    published_by integer,
    CONSTRAINT contracts_pkey PRIMARY KEY (id),
    CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) 
        REFERENCES public.users(id),
    CONSTRAINT contracts_director_decided_by_fkey FOREIGN KEY (director_decided_by) 
        REFERENCES public.users(id),
    CONSTRAINT contracts_forwarded_by_fkey FOREIGN KEY (forwarded_by) 
        REFERENCES public.users(id),
    CONSTRAINT contracts_last_edited_by_fkey FOREIGN KEY (last_edited_by) 
        REFERENCES public.users(id),
    CONSTRAINT contracts_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) 
        REFERENCES public.contracts(id) ON DELETE SET NULL,
    CONSTRAINT contracts_published_by_fkey FOREIGN KEY (published_by) 
        REFERENCES public.users(id),
    CONSTRAINT fk_parent_contract FOREIGN KEY (parent_contract_id) 
        REFERENCES public.contracts(id) ON DELETE SET NULL
);

-- Create amendment_comparisons table
CREATE TABLE public.amendment_comparisons (
    id integer NOT NULL DEFAULT nextval('public.amendment_comparisons_id_seq'::regclass),
    amendment_id integer NOT NULL,
    parent_contract_id integer NOT NULL,
    changed_fields jsonb,
    old_values jsonb,
    new_values jsonb,
    financial_impact jsonb,
    date_changes jsonb,
    comparison_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    comparison_confidence double precision DEFAULT 1.0,
    CONSTRAINT amendment_comparisons_amendment_id_parent_contract_id_key 
        UNIQUE (amendment_id, parent_contract_id),
    CONSTRAINT amendment_comparisons_pkey PRIMARY KEY (id),
    CONSTRAINT amendment_comparisons_amendment_id_fkey FOREIGN KEY (amendment_id) 
        REFERENCES public.contracts(id) ON DELETE CASCADE,
    CONSTRAINT amendment_comparisons_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) 
        REFERENCES public.contracts(id) ON DELETE CASCADE
);

-- Create contract_permissions table
CREATE TABLE public.contract_permissions (
    id integer NOT NULL DEFAULT nextval('public.contract_permissions_id_seq'::regclass),
    contract_id integer NOT NULL,
    user_id integer NOT NULL,
    permission_type character varying(20) NOT NULL,
    granted_at timestamp with time zone DEFAULT now(),
    granted_by integer,
    CONSTRAINT contract_permissions_pkey PRIMARY KEY (id),
    CONSTRAINT contract_permissions_contract_id_fkey FOREIGN KEY (contract_id) 
        REFERENCES public.contracts(id) ON DELETE CASCADE,
    CONSTRAINT contract_permissions_granted_by_fkey FOREIGN KEY (granted_by) 
        REFERENCES public.users(id),
    CONSTRAINT contract_permissions_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
    id integer NOT NULL DEFAULT nextval('public.activity_logs_id_seq'::regclass),
    user_id integer,
    activity_type character varying(50) NOT NULL,
    contract_id integer,
    details jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
    CONSTRAINT activity_logs_contract_id_fkey FOREIGN KEY (contract_id) 
        REFERENCES public.contracts(id),
    CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id)
);

-- Create contract_versions table
CREATE TABLE public.contract_versions (
    id integer NOT NULL DEFAULT nextval('public.contract_versions_id_seq'::regclass),
    contract_id integer NOT NULL,
    version_number integer NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    contract_data jsonb NOT NULL,
    changes_description text,
    version_type character varying(50) DEFAULT 'metadata_update'::character varying,
    CONSTRAINT contract_versions_contract_id_version_number_key 
        UNIQUE (contract_id, version_number),
    CONSTRAINT contract_versions_pkey PRIMARY KEY (id),
    CONSTRAINT contract_versions_contract_id_fkey FOREIGN KEY (contract_id) 
        REFERENCES public.contracts(id) ON DELETE CASCADE,
    CONSTRAINT contract_versions_created_by_fkey FOREIGN KEY (created_by) 
        REFERENCES public.users(id)
);

-- Create review_comments table
CREATE TABLE public.review_comments (
    id integer NOT NULL DEFAULT nextval('public.review_comments_id_seq'::regclass),
    contract_id integer NOT NULL,
    user_id integer NOT NULL,
    comment_type character varying(50) NOT NULL,
    comment text NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying,
    flagged_risk boolean DEFAULT false,
    flagged_issue boolean DEFAULT false,
    change_request jsonb,
    recommendation character varying(20),
    resolution_response text,
    resolved_by integer,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    parent_comment_id integer,
    thread_id character varying(50),
    is_resolution boolean DEFAULT false,
    CONSTRAINT review_comments_pkey PRIMARY KEY (id),
    CONSTRAINT review_comments_contract_id_fkey FOREIGN KEY (contract_id) 
        REFERENCES public.contracts(id) ON DELETE CASCADE,
    CONSTRAINT review_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) 
        REFERENCES public.review_comments(id),
    CONSTRAINT review_comments_resolved_by_fkey FOREIGN KEY (resolved_by) 
        REFERENCES public.users(id),
    CONSTRAINT review_comments_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id)
);

-- Create comment_tags table
CREATE TABLE public.comment_tags (
    id integer NOT NULL DEFAULT nextval('public.comment_tags_id_seq'::regclass),
    comment_id integer NOT NULL,
    tag_type character varying(50) NOT NULL,
    tag_value character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by integer,
    CONSTRAINT comment_tags_pkey PRIMARY KEY (id),
    CONSTRAINT comment_tags_comment_id_fkey FOREIGN KEY (comment_id) 
        REFERENCES public.review_comments(id) ON DELETE CASCADE,
    CONSTRAINT comment_tags_created_by_fkey FOREIGN KEY (created_by) 
        REFERENCES public.users(id)
);

-- Create comment_reactions table
CREATE TABLE public.comment_reactions (
    id integer NOT NULL DEFAULT nextval('public.comment_reactions_id_seq'::regclass),
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comment_reactions_comment_id_user_id_reaction_type_key 
        UNIQUE (comment_id, user_id, reaction_type),
    CONSTRAINT comment_reactions_pkey PRIMARY KEY (id),
    CONSTRAINT comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) 
        REFERENCES public.review_comments(id) ON DELETE CASCADE,
    CONSTRAINT comment_reactions_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id)
);

-- Create comment_attachments table
CREATE TABLE public.comment_attachments (
    id integer NOT NULL DEFAULT nextval('public.comment_attachments_id_seq'::regclass),
    comment_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    uploaded_by integer,
    uploaded_at timestamp with time zone DEFAULT now(),
    CONSTRAINT comment_attachments_pkey PRIMARY KEY (id),
    CONSTRAINT comment_attachments_comment_id_fkey FOREIGN KEY (comment_id) 
        REFERENCES public.review_comments(id) ON DELETE CASCADE,
    CONSTRAINT comment_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) 
        REFERENCES public.users(id)
);

-- Create contract_deliverables table
CREATE TABLE public.contract_deliverables (
    id integer NOT NULL DEFAULT nextval('public.contract_deliverables_id_seq'::regclass),
    contract_id integer NOT NULL,
    deliverable_name character varying(255) NOT NULL,
    description text,
    due_date date,
    status character varying(50),
    uploaded_file_path text,
    uploaded_file_name character varying(500),
    uploaded_at timestamp with time zone,
    uploaded_by integer,
    upload_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    file_data jsonb,
    CONSTRAINT contract_deliverables_pkey PRIMARY KEY (id),
    CONSTRAINT contract_deliverables_contract_id_fkey FOREIGN KEY (contract_id) 
        REFERENCES public.contracts(id),
    CONSTRAINT contract_deliverables_uploaded_by_fkey FOREIGN KEY (uploaded_by) 
        REFERENCES public.users(id)
);

-- Create modules table
CREATE TABLE public.modules (
    id integer NOT NULL DEFAULT nextval('public.modules_id_seq'::regclass),
    name character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    CONSTRAINT modules_pkey PRIMARY KEY (id),
    CONSTRAINT modules_created_by_fkey FOREIGN KEY (created_by) 
        REFERENCES public.users(id)
);

-- Create role_permissions table
CREATE TABLE public.role_permissions (
    id integer NOT NULL DEFAULT nextval('public.role_permissions_id_seq'::regclass),
    role character varying NOT NULL,
    module_id integer,
    permission character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
    CONSTRAINT role_permissions_role_module_id_permission_key 
        UNIQUE (role, module_id, permission),
    CONSTRAINT role_permissions_created_by_fkey FOREIGN KEY (created_by) 
        REFERENCES public.users(id),
    CONSTRAINT role_permissions_module_id_fkey FOREIGN KEY (module_id) 
        REFERENCES public.modules(id)
);

-- Create user_notifications table
CREATE TABLE public.user_notifications (
    id integer NOT NULL DEFAULT nextval('public.user_notifications_id_seq'::regclass),
    user_id integer NOT NULL,
    notification_type character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    contract_id integer,
    is_read boolean,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    CONSTRAINT user_notifications_pkey PRIMARY KEY (id),
    CONSTRAINT user_notifications_contract_id_fkey FOREIGN KEY (contract_id) 
        REFERENCES public.contracts(id),
    CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id)
);

-- Create indexes
CREATE INDEX idx_activity_logs_user_contract ON public.activity_logs USING btree (user_id, contract_id);
CREATE INDEX idx_amendment_comparisons_amendment_id ON public.amendment_comparisons USING btree (amendment_id);
CREATE INDEX idx_amendment_comparisons_parent_id ON public.amendment_comparisons USING btree (parent_contract_id);
CREATE INDEX idx_comment_attachments_comment_id ON public.comment_attachments USING btree (comment_id);
CREATE INDEX idx_comment_reactions_comment_id ON public.comment_reactions USING btree (comment_id);
CREATE INDEX idx_comment_tags_comment_id ON public.comment_tags USING btree (comment_id);
CREATE INDEX idx_contract_permissions_user_contract ON public.contract_permissions USING btree (user_id, contract_id);
CREATE INDEX idx_contract_versions_contract_id ON public.contract_versions USING btree (contract_id);
CREATE INDEX idx_contract_versions_created_by ON public.contract_versions USING btree (created_by);
CREATE INDEX idx_contracts_assigned_director_users ON public.contracts USING gin (assigned_director_users);
CREATE INDEX idx_contracts_assigned_pgm_users ON public.contracts USING gin (assigned_pgm_users);
CREATE INDEX idx_contracts_assigned_pm_users ON public.contracts USING gin (assigned_pm_users);
CREATE INDEX idx_contracts_created_by ON public.contracts USING btree (created_by);
CREATE INDEX idx_contracts_director_decision_status ON public.contracts USING btree (director_decision_status);
CREATE INDEX idx_contracts_document_type ON public.contracts USING btree (document_type);
CREATE INDEX idx_contracts_forwarded_by ON public.contracts USING btree (forwarded_by);
CREATE INDEX idx_contracts_grant_id ON public.contracts USING btree (grant_id);
CREATE INDEX idx_contracts_investment_id ON public.contracts USING btree (investment_id);
CREATE INDEX idx_contracts_last_edited_by ON public.contracts USING btree (last_edited_by);
CREATE INDEX idx_contracts_parent_contract_id ON public.contracts USING btree (parent_contract_id);
CREATE INDEX idx_contracts_program_manager_recommendation ON public.contracts USING btree (program_manager_recommendation);
CREATE INDEX idx_contracts_project_id ON public.contracts USING btree (project_id);
CREATE INDEX idx_contracts_published_by ON public.contracts USING btree (published_by);
CREATE INDEX idx_contracts_review_status ON public.contracts USING btree (review_status);
CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);
CREATE INDEX idx_contracts_status_created_by ON public.contracts USING btree (status, created_by);
CREATE INDEX idx_contracts_version ON public.contracts USING btree (version);
CREATE INDEX idx_extraction_logs_parent_id ON public.extraction_logs USING btree (parent_contract_id);
CREATE INDEX idx_review_comments_contract_id ON public.review_comments USING btree (contract_id);
CREATE INDEX idx_review_comments_flagged ON public.review_comments USING btree (flagged_risk, flagged_issue);
CREATE INDEX idx_review_comments_parent ON public.review_comments USING btree (parent_comment_id);
CREATE INDEX idx_review_comments_status ON public.review_comments USING btree (status);
CREATE INDEX idx_review_comments_thread ON public.review_comments USING btree (thread_id);
CREATE INDEX idx_review_comments_user_id ON public.review_comments USING btree (user_id);
CREATE INDEX idx_user_notifications_contract_id ON public.user_notifications USING btree (contract_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications USING btree (is_read);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_role ON public.users USING btree (role);
CREATE INDEX ix_contract_deliverables_id ON public.contract_deliverables USING btree (id);
CREATE INDEX ix_contracts_id ON public.contracts USING btree (id);
CREATE INDEX ix_extraction_logs_contract_id ON public.extraction_logs USING btree (contract_id);
CREATE INDEX ix_extraction_logs_id ON public.extraction_logs USING btree (id);
CREATE INDEX ix_user_notifications_id ON public.user_notifications USING btree (id);