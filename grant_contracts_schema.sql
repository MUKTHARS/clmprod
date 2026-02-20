--
-- PostgreSQL database dump
--

\restrict D3vjlP4x1d8S12RuBS4bmcjsVxAkRUaa7dYWJAUrRP1nPlJPLumVliGKsrjE85L

-- Dumped from database version 17.6 (Postgres.app)
-- Dumped by pg_dump version 17.6 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer DEFAULT nextval('public.activity_logs_id_seq'::regclass) NOT NULL,
    user_id integer,
    activity_type character varying(50) NOT NULL,
    contract_id integer,
    details jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: amendment_comparisons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.amendment_comparisons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.amendment_comparisons_id_seq OWNER TO postgres;

--
-- Name: amendment_comparisons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amendment_comparisons (
    id integer DEFAULT nextval('public.amendment_comparisons_id_seq'::regclass) NOT NULL,
    amendment_id integer NOT NULL,
    parent_contract_id integer NOT NULL,
    changed_fields jsonb,
    old_values jsonb,
    new_values jsonb,
    financial_impact jsonb,
    date_changes jsonb,
    comparison_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    comparison_confidence double precision DEFAULT 1.0
);


ALTER TABLE public.amendment_comparisons OWNER TO postgres;

--
-- Name: comment_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_attachments_id_seq OWNER TO postgres;

--
-- Name: comment_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_attachments (
    id integer DEFAULT nextval('public.comment_attachments_id_seq'::regclass) NOT NULL,
    comment_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    uploaded_by integer,
    uploaded_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comment_attachments OWNER TO postgres;

--
-- Name: comment_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_reactions_id_seq OWNER TO postgres;

--
-- Name: comment_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_reactions (
    id integer DEFAULT nextval('public.comment_reactions_id_seq'::regclass) NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comment_reactions OWNER TO postgres;

--
-- Name: comment_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comment_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_tags_id_seq OWNER TO postgres;

--
-- Name: comment_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_tags (
    id integer DEFAULT nextval('public.comment_tags_id_seq'::regclass) NOT NULL,
    comment_id integer NOT NULL,
    tag_type character varying(50) NOT NULL,
    tag_value character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by integer
);


ALTER TABLE public.comment_tags OWNER TO postgres;

--
-- Name: contract_deliverables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contract_deliverables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contract_deliverables_id_seq OWNER TO postgres;

--
-- Name: contract_deliverables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_deliverables (
    id integer DEFAULT nextval('public.contract_deliverables_id_seq'::regclass) NOT NULL,
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
    file_data jsonb
);


ALTER TABLE public.contract_deliverables OWNER TO postgres;

--
-- Name: contract_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contract_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contract_permissions_id_seq OWNER TO postgres;

--
-- Name: contract_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_permissions (
    id integer DEFAULT nextval('public.contract_permissions_id_seq'::regclass) NOT NULL,
    contract_id integer NOT NULL,
    user_id integer NOT NULL,
    permission_type character varying(20) NOT NULL,
    granted_at timestamp with time zone DEFAULT now(),
    granted_by integer
);


ALTER TABLE public.contract_permissions OWNER TO postgres;

--
-- Name: contract_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contract_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contract_versions_id_seq OWNER TO postgres;

--
-- Name: contract_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_versions (
    id integer DEFAULT nextval('public.contract_versions_id_seq'::regclass) NOT NULL,
    contract_id integer NOT NULL,
    version_number integer NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    contract_data jsonb NOT NULL,
    changes_description text,
    version_type character varying(50) DEFAULT 'metadata_update'::character varying
);


ALTER TABLE public.contract_versions OWNER TO postgres;

--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contracts_id_seq OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id integer DEFAULT nextval('public.contracts_id_seq'::regclass) NOT NULL,
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
    published_by integer
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: extraction_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.extraction_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.extraction_logs_id_seq OWNER TO postgres;

--
-- Name: extraction_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extraction_logs (
    id integer DEFAULT nextval('public.extraction_logs_id_seq'::regclass) NOT NULL,
    contract_id integer,
    extraction_type character varying,
    field_name character varying,
    extracted_value text,
    confidence_score double precision,
    "timestamp" timestamp with time zone DEFAULT now(),
    parent_contract_id integer,
    previous_value text
);


ALTER TABLE public.extraction_logs OWNER TO postgres;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO postgres;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id integer DEFAULT nextval('public.modules_id_seq'::regclass) NOT NULL,
    name character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: reporting_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reporting_events (
    id integer NOT NULL,
    contract_id integer NOT NULL,
    report_type character varying NOT NULL,
    due_date date NOT NULL,
    status character varying,
    uploaded_file_path character varying,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone,
    uploaded_file_name character varying,
    uploaded_at timestamp without time zone,
    pgm_approved boolean DEFAULT false,
    pgm_approved_at timestamp without time zone,
    pgm_approved_by integer,
    director_approved boolean DEFAULT false,
    director_approved_at timestamp without time zone
);


ALTER TABLE public.reporting_events OWNER TO postgres;

--
-- Name: reporting_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reporting_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reporting_events_id_seq OWNER TO postgres;

--
-- Name: reporting_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reporting_events_id_seq OWNED BY public.reporting_events.id;


--
-- Name: reporting_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reporting_schedules (
    id integer NOT NULL,
    contract_id integer,
    frequency character varying,
    report_types json,
    due_dates json,
    format_requirements character varying,
    submission_method character varying,
    recipients json,
    created_at timestamp without time zone
);


ALTER TABLE public.reporting_schedules OWNER TO postgres;

--
-- Name: reporting_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reporting_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reporting_schedules_id_seq OWNER TO postgres;

--
-- Name: reporting_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reporting_schedules_id_seq OWNED BY public.reporting_schedules.id;


--
-- Name: review_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_comments_id_seq OWNER TO postgres;

--
-- Name: review_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_comments (
    id integer DEFAULT nextval('public.review_comments_id_seq'::regclass) NOT NULL,
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
    is_resolution boolean DEFAULT false
);


ALTER TABLE public.review_comments OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer DEFAULT nextval('public.role_permissions_id_seq'::regclass) NOT NULL,
    role character varying NOT NULL,
    module_id integer,
    permission character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notifications_id_seq OWNER TO postgres;

--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notifications (
    id integer DEFAULT nextval('public.user_notifications_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    notification_type character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    contract_id integer,
    is_read boolean,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);


ALTER TABLE public.user_notifications OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer DEFAULT nextval('public.user_sessions_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    session_token character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    ip_address character varying(45),
    user_agent text
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer DEFAULT nextval('public.users_id_seq'::regclass) NOT NULL,
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
    user_type character varying DEFAULT 'internal'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: reporting_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_events ALTER COLUMN id SET DEFAULT nextval('public.reporting_events_id_seq'::regclass);


--
-- Name: reporting_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_schedules ALTER COLUMN id SET DEFAULT nextval('public.reporting_schedules_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: amendment_comparisons amendment_comparisons_amendment_id_parent_contract_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons
    ADD CONSTRAINT amendment_comparisons_amendment_id_parent_contract_id_key UNIQUE (amendment_id, parent_contract_id);


--
-- Name: amendment_comparisons amendment_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons
    ADD CONSTRAINT amendment_comparisons_pkey PRIMARY KEY (id);


--
-- Name: comment_attachments comment_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT comment_attachments_pkey PRIMARY KEY (id);


--
-- Name: comment_reactions comment_reactions_comment_id_user_id_reaction_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_comment_id_user_id_reaction_type_key UNIQUE (comment_id, user_id, reaction_type);


--
-- Name: comment_reactions comment_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_pkey PRIMARY KEY (id);


--
-- Name: comment_tags comment_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_tags
    ADD CONSTRAINT comment_tags_pkey PRIMARY KEY (id);


--
-- Name: contract_deliverables contract_deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_deliverables
    ADD CONSTRAINT contract_deliverables_pkey PRIMARY KEY (id);


--
-- Name: contract_permissions contract_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions
    ADD CONSTRAINT contract_permissions_pkey PRIMARY KEY (id);


--
-- Name: contract_versions contract_versions_contract_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_contract_id_version_number_key UNIQUE (contract_id, version_number);


--
-- Name: contract_versions contract_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: extraction_logs extraction_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extraction_logs
    ADD CONSTRAINT extraction_logs_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: reporting_events reporting_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_events
    ADD CONSTRAINT reporting_events_pkey PRIMARY KEY (id);


--
-- Name: reporting_schedules reporting_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_schedules
    ADD CONSTRAINT reporting_schedules_pkey PRIMARY KEY (id);


--
-- Name: review_comments review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_module_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_module_id_permission_key UNIQUE (role, module_id, permission);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_activity_logs_user_contract; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_user_contract ON public.activity_logs USING btree (user_id, contract_id);


--
-- Name: idx_amendment_comparisons_amendment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_amendment_comparisons_amendment_id ON public.amendment_comparisons USING btree (amendment_id);


--
-- Name: idx_amendment_comparisons_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_amendment_comparisons_parent_id ON public.amendment_comparisons USING btree (parent_contract_id);


--
-- Name: idx_comment_attachments_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comment_attachments_comment_id ON public.comment_attachments USING btree (comment_id);


--
-- Name: idx_comment_reactions_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comment_reactions_comment_id ON public.comment_reactions USING btree (comment_id);


--
-- Name: idx_comment_tags_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comment_tags_comment_id ON public.comment_tags USING btree (comment_id);


--
-- Name: idx_contract_permissions_user_contract; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_permissions_user_contract ON public.contract_permissions USING btree (user_id, contract_id);


--
-- Name: idx_contract_versions_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_versions_contract_id ON public.contract_versions USING btree (contract_id);


--
-- Name: idx_contract_versions_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_versions_created_by ON public.contract_versions USING btree (created_by);


--
-- Name: idx_contracts_assigned_director_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_assigned_director_users ON public.contracts USING gin (assigned_director_users);


--
-- Name: idx_contracts_assigned_pgm_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_assigned_pgm_users ON public.contracts USING gin (assigned_pgm_users);


--
-- Name: idx_contracts_assigned_pm_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_assigned_pm_users ON public.contracts USING gin (assigned_pm_users);


--
-- Name: idx_contracts_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_created_by ON public.contracts USING btree (created_by);


--
-- Name: idx_contracts_director_decision_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_director_decision_status ON public.contracts USING btree (director_decision_status);


--
-- Name: idx_contracts_document_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_document_type ON public.contracts USING btree (document_type);


--
-- Name: idx_contracts_forwarded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_forwarded_by ON public.contracts USING btree (forwarded_by);


--
-- Name: idx_contracts_grant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_grant_id ON public.contracts USING btree (grant_id);


--
-- Name: idx_contracts_investment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_investment_id ON public.contracts USING btree (investment_id);


--
-- Name: idx_contracts_last_edited_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_last_edited_by ON public.contracts USING btree (last_edited_by);


--
-- Name: idx_contracts_parent_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_parent_contract_id ON public.contracts USING btree (parent_contract_id);


--
-- Name: idx_contracts_program_manager_recommendation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_program_manager_recommendation ON public.contracts USING btree (program_manager_recommendation);


--
-- Name: idx_contracts_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_project_id ON public.contracts USING btree (project_id);


--
-- Name: idx_contracts_published_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_published_by ON public.contracts USING btree (published_by);


--
-- Name: idx_contracts_review_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_review_status ON public.contracts USING btree (review_status);


--
-- Name: idx_contracts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);


--
-- Name: idx_contracts_status_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status_created_by ON public.contracts USING btree (status, created_by);


--
-- Name: idx_contracts_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_version ON public.contracts USING btree (version);


--
-- Name: idx_extraction_logs_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extraction_logs_parent_id ON public.extraction_logs USING btree (parent_contract_id);


--
-- Name: idx_review_comments_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_contract_id ON public.review_comments USING btree (contract_id);


--
-- Name: idx_review_comments_flagged; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_flagged ON public.review_comments USING btree (flagged_risk, flagged_issue);


--
-- Name: idx_review_comments_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_parent ON public.review_comments USING btree (parent_comment_id);


--
-- Name: idx_review_comments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_status ON public.review_comments USING btree (status);


--
-- Name: idx_review_comments_thread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_thread ON public.review_comments USING btree (thread_id);


--
-- Name: idx_review_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_user_id ON public.review_comments USING btree (user_id);


--
-- Name: idx_user_notifications_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_contract_id ON public.user_notifications USING btree (contract_id);


--
-- Name: idx_user_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_is_read ON public.user_notifications USING btree (is_read);


--
-- Name: idx_user_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: ix_contract_deliverables_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_contract_deliverables_id ON public.contract_deliverables USING btree (id);


--
-- Name: ix_contracts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_contracts_id ON public.contracts USING btree (id);


--
-- Name: ix_extraction_logs_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_extraction_logs_contract_id ON public.extraction_logs USING btree (contract_id);


--
-- Name: ix_extraction_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_extraction_logs_id ON public.extraction_logs USING btree (id);


--
-- Name: ix_reporting_events_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reporting_events_id ON public.reporting_events USING btree (id);


--
-- Name: ix_reporting_schedules_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reporting_schedules_id ON public.reporting_schedules USING btree (id);


--
-- Name: ix_user_notifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_notifications_id ON public.user_notifications USING btree (id);


--
-- Name: activity_logs activity_logs_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: amendment_comparisons amendment_comparisons_amendment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons
    ADD CONSTRAINT amendment_comparisons_amendment_id_fkey FOREIGN KEY (amendment_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: amendment_comparisons amendment_comparisons_parent_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons
    ADD CONSTRAINT amendment_comparisons_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: comment_attachments comment_attachments_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT comment_attachments_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.review_comments(id) ON DELETE CASCADE;


--
-- Name: comment_attachments comment_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT comment_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: comment_reactions comment_reactions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.review_comments(id) ON DELETE CASCADE;


--
-- Name: comment_reactions comment_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: comment_tags comment_tags_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_tags
    ADD CONSTRAINT comment_tags_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.review_comments(id) ON DELETE CASCADE;


--
-- Name: comment_tags comment_tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_tags
    ADD CONSTRAINT comment_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: contract_deliverables contract_deliverables_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_deliverables
    ADD CONSTRAINT contract_deliverables_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: contract_deliverables contract_deliverables_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_deliverables
    ADD CONSTRAINT contract_deliverables_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: contract_permissions contract_permissions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions
    ADD CONSTRAINT contract_permissions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_permissions contract_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions
    ADD CONSTRAINT contract_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- Name: contract_permissions contract_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions
    ADD CONSTRAINT contract_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contract_versions contract_versions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_versions contract_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: contracts contracts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: contracts contracts_director_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_director_decided_by_fkey FOREIGN KEY (director_decided_by) REFERENCES public.users(id);


--
-- Name: contracts contracts_forwarded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_forwarded_by_fkey FOREIGN KEY (forwarded_by) REFERENCES public.users(id);


--
-- Name: contracts contracts_last_edited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_last_edited_by_fkey FOREIGN KEY (last_edited_by) REFERENCES public.users(id);


--
-- Name: contracts contracts_parent_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- Name: contracts contracts_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id);


--
-- Name: contracts fk_parent_contract; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT fk_parent_contract FOREIGN KEY (parent_contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- Name: modules modules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: reporting_events reporting_events_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_events
    ADD CONSTRAINT reporting_events_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: reporting_schedules reporting_schedules_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_schedules
    ADD CONSTRAINT reporting_schedules_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: review_comments review_comments_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: review_comments review_comments_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.review_comments(id);


--
-- Name: review_comments review_comments_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: review_comments review_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: user_notifications user_notifications_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict D3vjlP4x1d8S12RuBS4bmcjsVxAkRUaa7dYWJAUrRP1nPlJPLumVliGKsrjE85L

