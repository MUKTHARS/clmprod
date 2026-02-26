--
-- PostgreSQL database dump
--

\restrict Vznc3OAW1bIHRocYYxIfov6srnpkUor1HQutgz9vac77GRBUbArtSHmDaVfeKaq

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-23 10:45:53

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 125417)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
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
-- TOC entry 231 (class 1259 OID 125416)
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

--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 231
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- TOC entry 228 (class 1259 OID 125364)
-- Name: amendment_comparisons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amendment_comparisons (
    id integer NOT NULL,
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
-- TOC entry 227 (class 1259 OID 125363)
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
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 227
-- Name: amendment_comparisons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.amendment_comparisons_id_seq OWNED BY public.amendment_comparisons.id;


--
-- TOC entry 242 (class 1259 OID 125578)
-- Name: comment_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_attachments (
    id integer NOT NULL,
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
-- TOC entry 241 (class 1259 OID 125577)
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
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 241
-- Name: comment_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_attachments_id_seq OWNED BY public.comment_attachments.id;


--
-- TOC entry 240 (class 1259 OID 125554)
-- Name: comment_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_reactions (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comment_reactions OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 125553)
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
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 239
-- Name: comment_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_reactions_id_seq OWNED BY public.comment_reactions.id;


--
-- TOC entry 238 (class 1259 OID 125532)
-- Name: comment_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_tags (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    tag_type character varying(50) NOT NULL,
    tag_value character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by integer
);


ALTER TABLE public.comment_tags OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 125531)
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
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 237
-- Name: comment_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comment_tags_id_seq OWNED BY public.comment_tags.id;


--
-- TOC entry 244 (class 1259 OID 166360)
-- Name: contract_deliverables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_deliverables (
    id integer NOT NULL,
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
-- TOC entry 243 (class 1259 OID 166359)
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
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 243
-- Name: contract_deliverables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contract_deliverables_id_seq OWNED BY public.contract_deliverables.id;


--
-- TOC entry 230 (class 1259 OID 125390)
-- Name: contract_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_permissions (
    id integer NOT NULL,
    contract_id integer NOT NULL,
    user_id integer NOT NULL,
    permission_type character varying(20) NOT NULL,
    granted_at timestamp with time zone DEFAULT now(),
    granted_by integer
);


ALTER TABLE public.contract_permissions OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 125389)
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
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 229
-- Name: contract_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contract_permissions_id_seq OWNED BY public.contract_permissions.id;


--
-- TOC entry 234 (class 1259 OID 125459)
-- Name: contract_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_versions (
    id integer NOT NULL,
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
-- TOC entry 233 (class 1259 OID 125458)
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
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 233
-- Name: contract_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contract_versions_id_seq OWNED BY public.contract_versions.id;


--
-- TOC entry 226 (class 1259 OID 125337)
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id integer NOT NULL,
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
    first_name character varying,
    last_name character varying,
    company character varying,
    user_type character varying DEFAULT 'internal'::character varying
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 125336)
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
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 225
-- Name: contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contracts_id_seq OWNED BY public.contracts.id;


--
-- TOC entry 220 (class 1259 OID 125169)
-- Name: extraction_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extraction_logs (
    id integer NOT NULL,
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
-- TOC entry 219 (class 1259 OID 125168)
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
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 219
-- Name: extraction_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.extraction_logs_id_seq OWNED BY public.extraction_logs.id;


--
-- TOC entry 246 (class 1259 OID 166534)
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 166533)
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
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 245
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- TOC entry 254 (class 1259 OID 184510)
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
    pgm_approved boolean,
    pgm_approved_at timestamp without time zone,
    pgm_approved_by integer,
    director_approved boolean,
    director_approved_at timestamp without time zone
);


ALTER TABLE public.reporting_events OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 184509)
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
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 253
-- Name: reporting_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reporting_events_id_seq OWNED BY public.reporting_events.id;


--
-- TOC entry 252 (class 1259 OID 184494)
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
-- TOC entry 251 (class 1259 OID 184493)
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
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 251
-- Name: reporting_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reporting_schedules_id_seq OWNED BY public.reporting_schedules.id;


--
-- TOC entry 236 (class 1259 OID 125489)
-- Name: review_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_comments (
    id integer NOT NULL,
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
-- TOC entry 235 (class 1259 OID 125488)
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
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 235
-- Name: review_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_comments_id_seq OWNED BY public.review_comments.id;


--
-- TOC entry 248 (class 1259 OID 166552)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role character varying NOT NULL,
    module_id integer,
    permission character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 166551)
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
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 247
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- TOC entry 257 (class 1259 OID 204121)
-- Name: tenant_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_modules (
    id integer NOT NULL,
    tenant_id uuid NOT NULL,
    module_key character varying(100) NOT NULL,
    is_enabled boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tenant_modules OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 204120)
-- Name: tenant_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenant_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenant_modules_id_seq OWNER TO postgres;

--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 256
-- Name: tenant_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenant_modules_id_seq OWNED BY public.tenant_modules.id;


--
-- TOC entry 255 (class 1259 OID 204110)
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    name character varying,
    domain character varying,
    setup_completed boolean,
    is_active boolean,
    created_at timestamp without time zone,
    workflow_config jsonb,
    ai_config jsonb
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 174692)
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notifications (
    id integer NOT NULL,
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
-- TOC entry 249 (class 1259 OID 174691)
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
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 249
-- Name: user_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_notifications_id_seq OWNED BY public.user_notifications.id;


--
-- TOC entry 224 (class 1259 OID 125316)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_token character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    ip_address character varying(45),
    user_agent text
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 125315)
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
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 223
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- TOC entry 222 (class 1259 OID 125295)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
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
-- TOC entry 221 (class 1259 OID 125294)
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
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4983 (class 2604 OID 125420)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 4978 (class 2604 OID 125367)
-- Name: amendment_comparisons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons ALTER COLUMN id SET DEFAULT nextval('public.amendment_comparisons_id_seq'::regclass);


--
-- TOC entry 4998 (class 2604 OID 125581)
-- Name: comment_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_attachments ALTER COLUMN id SET DEFAULT nextval('public.comment_attachments_id_seq'::regclass);


--
-- TOC entry 4996 (class 2604 OID 125557)
-- Name: comment_reactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions ALTER COLUMN id SET DEFAULT nextval('public.comment_reactions_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 125535)
-- Name: comment_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_tags ALTER COLUMN id SET DEFAULT nextval('public.comment_tags_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 166363)
-- Name: contract_deliverables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_deliverables ALTER COLUMN id SET DEFAULT nextval('public.contract_deliverables_id_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 125393)
-- Name: contract_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions ALTER COLUMN id SET DEFAULT nextval('public.contract_permissions_id_seq'::regclass);


--
-- TOC entry 4985 (class 2604 OID 125462)
-- Name: contract_versions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions ALTER COLUMN id SET DEFAULT nextval('public.contract_versions_id_seq'::regclass);


--
-- TOC entry 4959 (class 2604 OID 125340)
-- Name: contracts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts ALTER COLUMN id SET DEFAULT nextval('public.contracts_id_seq'::regclass);


--
-- TOC entry 4950 (class 2604 OID 125172)
-- Name: extraction_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extraction_logs ALTER COLUMN id SET DEFAULT nextval('public.extraction_logs_id_seq'::regclass);


--
-- TOC entry 5003 (class 2604 OID 166537)
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- TOC entry 5011 (class 2604 OID 184513)
-- Name: reporting_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_events ALTER COLUMN id SET DEFAULT nextval('public.reporting_events_id_seq'::regclass);


--
-- TOC entry 5010 (class 2604 OID 184497)
-- Name: reporting_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_schedules ALTER COLUMN id SET DEFAULT nextval('public.reporting_schedules_id_seq'::regclass);


--
-- TOC entry 4988 (class 2604 OID 125492)
-- Name: review_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments ALTER COLUMN id SET DEFAULT nextval('public.review_comments_id_seq'::regclass);


--
-- TOC entry 5006 (class 2604 OID 166555)
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- TOC entry 5012 (class 2604 OID 204124)
-- Name: tenant_modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_modules ALTER COLUMN id SET DEFAULT nextval('public.tenant_modules_id_seq'::regclass);


--
-- TOC entry 5008 (class 2604 OID 174695)
-- Name: user_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications ALTER COLUMN id SET DEFAULT nextval('public.user_notifications_id_seq'::regclass);


--
-- TOC entry 4957 (class 2604 OID 125319)
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- TOC entry 4952 (class 2604 OID 125298)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5317 (class 0 OID 125417)
-- Dependencies: 232
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, activity_type, contract_id, details, ip_address, user_agent, created_at) FROM stdin;
1	15	upload	1	{"filename": "INV-076000 Agreement.pdf", "contract_id": 1}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:47:39.963762+05:30
2	15	update_draft	1	{"contract_id": 1, "updated_fields": ["grant_name", "contract_number", "grantor", "grantee", "total_amount", "start_date", "end_date", "purpose", "notes", "assigned_users"]}	\N	\N	2026-02-18 14:48:02.690183+05:30
3	15	submit_review	1	{"notes": "asdasdasdasdasd", "new_status": "under_review", "old_status": "draft", "contract_id": 1, "version_number": 1, "assigned_program_managers": [18], "assigned_program_managers_count": 1}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:06.61117+05:30
4	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:09.854391+05:30
5	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:09.906314+05:30
6	15	login	\N	{"method": "password"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:21.278795+05:30
7	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:21.29545+05:30
8	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:21.351516+05:30
9	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:21.427129+05:30
10	18	login	\N	{"method": "password"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:29.925769+05:30
11	18	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:29.941431+05:30
12	18	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:30.008506+05:30
13	18	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:30.063996+05:30
14	18	view_contract	1	{"contract_id": 1}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:34.419057+05:30
15	18	view_contract	1	{"contract_id": 1}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:34.521435+05:30
16	18	submit_review	1	{"new_status": "reviewed", "old_status": "under_review", "contract_id": 1, "has_summary": true, "recommendation": "approve", "key_issues_count": 0, "change_requests_count": 0, "forwarded_to_director": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:40.652473+05:30
17	15	login	\N	{"method": "password"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:48.305543+05:30
18	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:48.319665+05:30
19	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:48.368114+05:30
20	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:48.426183+05:30
21	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:50.433897+05:30
22	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:48:50.551571+05:30
23	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:59:03.598486+05:30
24	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:59:03.677403+05:30
25	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:59:05.924082+05:30
26	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:59:05.990251+05:30
27	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:59:47.961233+05:30
28	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 14:59:48.05037+05:30
29	18	login	\N	{"method": "password"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:00.026255+05:30
30	18	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:00.093062+05:30
31	18	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:00.177192+05:30
39	17	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:22.019838+05:30
43	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:39.652958+05:30
32	18	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:00.226868+05:30
44	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:39.704184+05:30
51	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:51.443033+05:30
53	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:52.483049+05:30
54	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:56.051022+05:30
33	18	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:01.828422+05:30
35	17	login	\N	{"method": "password"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:19.61902+05:30
38	17	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:19.743782+05:30
40	17	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:22.080776+05:30
45	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:39.757159+05:30
49	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:44.063125+05:30
50	15	final_publish	1	{"notes": "sads", "contract_id": 1, "final_status": "published", "version_number": 2}	\N	\N	2026-02-18 15:00:50.17421+05:30
34	18	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:01.863301+05:30
37	17	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:19.696365+05:30
41	17	final_approval	1	{"decision": "approve", "new_status": "approved", "old_status": "reviewed", "contract_id": 1, "notified_pm": true, "notified_pgms": 1, "risk_accepted": false, "contract_locked": false, "business_sign_off": false, "director_assigned": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:31.086846+05:30
42	15	login	\N	{"method": "password"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:39.640061+05:30
47	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:41.656894+05:30
36	17	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:19.634643+05:30
46	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:41.616055+05:30
48	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 100}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:44.021877+05:30
52	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:52.442941+05:30
55	15	view_all_contracts	\N	{"skip": 0, "count": 1, "limit": 500}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-18 15:00:56.10679+05:30
\.


--
-- TOC entry 5313 (class 0 OID 125364)
-- Dependencies: 228
-- Data for Name: amendment_comparisons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.amendment_comparisons (id, amendment_id, parent_contract_id, changed_fields, old_values, new_values, financial_impact, date_changes, comparison_timestamp, comparison_confidence) FROM stdin;
\.


--
-- TOC entry 5327 (class 0 OID 125578)
-- Dependencies: 242
-- Data for Name: comment_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_attachments (id, comment_id, filename, file_path, file_size, mime_type, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5325 (class 0 OID 125554)
-- Dependencies: 240
-- Data for Name: comment_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_reactions (id, comment_id, user_id, reaction_type, created_at) FROM stdin;
\.


--
-- TOC entry 5323 (class 0 OID 125532)
-- Dependencies: 238
-- Data for Name: comment_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_tags (id, comment_id, tag_type, tag_value, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 5329 (class 0 OID 166360)
-- Dependencies: 244
-- Data for Name: contract_deliverables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_deliverables (id, contract_id, deliverable_name, description, due_date, status, uploaded_file_path, uploaded_file_name, uploaded_at, uploaded_by, upload_notes, created_at, updated_at, file_data) FROM stdin;
\.


--
-- TOC entry 5315 (class 0 OID 125390)
-- Dependencies: 230
-- Data for Name: contract_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_permissions (id, contract_id, user_id, permission_type, granted_at, granted_by) FROM stdin;
\.


--
-- TOC entry 5319 (class 0 OID 125459)
-- Dependencies: 234
-- Data for Name: contract_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_versions (id, contract_id, version_number, created_by, created_at, contract_data, changes_description, version_type) FROM stdin;
1	1	1	15	2026-02-18 14:48:06.576413+05:30	{"basic_data": {"status": "draft", "grantee": "ABC Centre Ltd", "grantor": "Saple Foundation", "purpose": "To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.", "end_date": "2027-03-31", "grant_name": "Scaling unified Health Campaign Management in Africa", "start_date": "2024-05-10", "total_amount": 7675190.0, "contract_number": "INV-076000"}, "contract_data": {"parties": {"grantee": {"email": "james@abccentre.co.uk", "phone": "Not specified", "address": "11 St Cross Street, Hatton Garden, London EC1N 8UB, GBR", "contact_person": "James Bond", "signatory_name": "James Bond", "signature_date": "2024-05-10", "signatory_title": "Director", "organization_name": "ABC Centre Ltd"}, "grantor": {"email": "rose.whitefield@saple.org", "phone": "Not specified", "address": "1000 W. Maude Avenue, Sunnyvale, CA 94085, USA", "contact_person": "Rose Whitefield", "signatory_name": "Rose Whitefield", "signature_date": "2024-05-07", "signatory_title": "Senior Program Officer", "organization_name": "Saple Foundation"}}, "summary": {"risk_assessment": "No specific risk assessment found", "executive_summary": "Scaling unified Health Campaign Management in Africa between Saple Foundation and ABC Centre Ltd. Total grant amount: USD 7,675,190.00. Purpose: To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.. Deliverables: 2 items specified.", "financial_summary": "Total grant: USD 7,675,190.00 (4 installments)", "key_dates_summary": "Start: 2024-05-10; End: 2027-03-31; Signed: 2024-05-10"}, "metadata": {"document_type": "Grant Agreement", "extraction_timestamp": "2026-02-18T14:47:33.534274", "pages_extracted_from": 7, "extraction_confidence": 0.95}, "deliverables": {"items": [{"status": "pending", "due_date": "2025-01-31", "description": "Submission of progress reports demonstrating meaningful progress against targets or milestones.", "deliverable_name": "Progress Reports"}, {"status": "pending", "due_date": "2027-03-31", "description": "Development and deployment of a platform to assist Health Ministries in malaria endemic countries.", "deliverable_name": "Health Campaign Management Platform"}], "reporting_requirements": {"due_dates": ["2025-01-31", "2026-01-31", "2027-01-31", "2028-04-30"], "frequency": "Annually", "recipients": ["Rose Whitefield"], "report_types": ["Final Report", "Progress Report"], "submission_method": "Email or portal", "format_requirements": "Foundation's templates or forms"}}, "extended_data": {"all_dates_found": [{"date": "March 31, 2027", "type": "Month DD, YYYY", "context": " Ministries in malaria endemic countries in Africa \\"Start Date\\": Date of last signature \\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment "}, {"date": "February 19, 2024", "type": "Month DD, YYYY", "context": "nd • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\""}, {"date": "February 18, 2024", "type": "Month DD, YYYY", "context": "y this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundatio"}, {"date": "May 7, 2024", "type": "Month DD, YYYY", "context": "2 / Rose Whitefield James Bond Title: /Title1Senior Program Officer/ Title: /Title2Director/ Date: 1May 7, 2024/ Date:MMay 10, 20242/ 1 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREE"}, {"date": "May 10, 2024", "type": "Month DD, YYYY", "context": " James Bond Title: /Title1Senior Program Officer/ Title: /Title2Director/ Date: 1May 7, 2024/ Date:MMay 10, 20242/ 1 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investment ID I"}, {"date": "January 31, 2025", "type": "Month DD, YYYY", "context": "eceived by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February"}, {"date": "January 31, 2026", "type": "Month DD, YYYY", "context": " to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of "}, {"date": "January 31, 2027", "type": "Month DD, YYYY", "context": " to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envel"}, {"date": "April 30, 2028", "type": "Month DD, YYYY", "context": "Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD2"}, {"date": "March 31, 2027", "type": "Month DD, YYYY", "context": " Ministries in malaria endemic countries in Africa \\"Start Date\\": Date of last signature \\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment "}, {"date": "February 19, 2024", "type": "Month DD, YYYY", "context": "nd • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\""}, {"date": "February 18, 2024", "type": "Month DD, YYYY", "context": "y this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundatio"}, {"date": "May 29, 2024", "type": "Month DD, YYYY", "context": "ting Deliverable | Due By | Payment Date | | Payment Amount (U.S.$) | | | Countersigned Agreement | May 29, 2024 | Within 15 days after receipt of countersigned Agreement if received by Due By date | | $3175000.0"}, {"date": "January 31, 2025", "type": "Month DD, YYYY", "context": "eceived by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February"}, {"date": "March 14, 2025", "type": "Month DD, YYYY", "context": "ived by Due By date | | $3175000.00 | Start of Investment to January 31, 2025 | | Progress Report | March 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14,"}, {"date": "February 1, 2025", "type": "Month DD, YYYY", "context": " Investment to January 31, 2025 | | Progress Report | March 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1,"}, {"date": "January 31, 2026", "type": "Month DD, YYYY", "context": " to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of "}, {"date": "March 14, 2026", "type": "Month DD, YYYY", "context": " 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14,"}, {"date": "February 1, 2026", "type": "Month DD, YYYY", "context": "ary 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14, 2027 | April 2027 | | $2000000.00 | Life of Inv"}, {"date": "January 31, 2027", "type": "Month DD, YYYY", "context": " to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envel"}, {"date": "March 14, 2027", "type": "Month DD, YYYY", "context": " 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14, 2027 | April 2027 | | $2000000.00 | Life of Investment | | Final Report | April 30, 2028 | | | | Total G"}, {"date": "April 30, 2028", "type": "Month DD, YYYY", "context": "Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD2"}], "signatures_found": [{"date": "Not specified", "name": "PAGE GRANTEE INFORMATION Name: ABC Centre Ltd Public Charity equivalent pursuant to U", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "\\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment Schedule (Attachment A) includes and • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundation\\"), and is effective as of date of last signature", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement May Within 15 days $3175000", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "by authorized representatives of both Parties", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Page, or as otherwise directed by the other Party", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "S Except as may be prohibited by applicable law or regulation, this Agreement and any amendment may be signed in counterparts, by facsimile, PDF, or other electronic means, each of which will be deemed an original and all of which when taken together will constitute one agreement", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "s will be binding for all purposes", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "| \\"End Date\\": | | March 31, 2027 | This Agreement includes and incorporates by this reference: | | This Agreement Summary & Signature Page and: • Grant Amount and Reporting & Payment Schedule (Attachment A) • Terms and Conditions (Attachment B) • Investment Document (date submitted February 19, 2024) • Budget (date submitted February 18, 2024) | REPORTING & PAYMENT SCHEDULE | | | | | | | Investment Period | | Target, Milestone, or Reporting Deliverable | Due By | Payment Date | | Payment Amount (U", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement | May 29, 2024 | Within 15 days after receipt of countersigned Agreement if received by Due By date | | $3175000", "title": "Not specified", "context": "Signature mentioned"}], "all_amounts_found": [{"type": "monetary_amount", "amount": 32.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 9.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 855.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 401.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 47.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 8.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 255.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 528.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 34.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 76.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 0.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 509.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 509.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 11.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 8.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 100.0, "context": "25 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2", "currency": "USD"}, {"type": "monetary_amount", "amount": 0.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 940.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 85.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 31.0, "context": "y Payment Date Payment Amount Period Deliverable (U.S.$) Countersigned Agreement May Within 15 days $3175000.00 29, 2024 after receipt of countersigned Agreement if received by Due By date Start of Progr", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 19.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 18.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 10.0, "context": "25 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 ", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 42.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 32.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 9.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}], "table_data_extracted": [], "deliverables_extracted_count": 2}, "reference_ids": {"grant_id": "AGREEMENT", "project_id": null, "investment_id": "INV-076000", "extracted_reference_ids": [{"type": "investment_id", "value": "INV-076000", "pattern": "Investment\\\\s*(?:ID|Number|No\\\\.?)[:\\\\s]*([A-Z0-9\\\\-/#]+)"}, {"type": "grant_id", "value": "AGREEMENT", "pattern": "GRANT[:\\\\s]+([A-Z0-9\\\\-/#]+)"}]}, "review_history": [{"notes": "asdasdasdasdasd", "action": "submitted_for_review", "timestamp": "2026-02-18T09:18:06.583668", "by_user_id": 15, "new_status": "under_review", "old_status": "draft", "by_user_name": "testingpm", "version_number": 1}], "contract_details": {"purpose": "To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.", "duration": "Approximately 3 years", "end_date": "2027-03-31", "grant_name": "Scaling unified Health Campaign Management in Africa", "objectives": ["Develop a health campaign management platform.", "Assist Health Ministries in malaria endemic countries."], "start_date": "2024-05-10", "scope_of_work": "The project involves the development and deployment of a health campaign management platform to support Health Ministries in Africa.", "agreement_type": "Grant Agreement", "effective_date": "2024-05-10", "signature_date": "2024-05-10", "contract_number": "INV-076000", "grant_reference": "INV-076000", "risk_management": "Not specified", "geographic_scope": "Africa", "detailed_scope_of_work": {"key_milestones": [], "main_activities": ["and manage the Project and the Funded Developments in a manner that ensures Global Access"], "timeline_phases": [], "deliverables_list": ["required under this Agreement", "| Due By | Payment Date | | Payment Amount (U", "the audit report to the Foundation upon request, including the management letter and a detailed plan for remedying any deficiencies observed (\\"Remediation Plan\\")"], "resources_required": [], "project_description": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMENT Investment ID INV-076000 AGREEMENT SUMMARY & SIGNATURE PAGE GRANTEE INFORMATION Name: ABC Centre Ltd Public Charity equivalent pursuant to U.S. IRC § 509(a)(1) or 509(a)(2) Tax Status: You confirm that the above information is correct and agree to notify the Foundation immediately of any change. Mailing Address: 11 St Cross Street, Hatton Garden, London EC1N 8UB, GBR Primary Contact: James Bo", "technical_requirements": []}}, "financial_details": {"currency": "USD", "budget_breakdown": {"other": "Not specified", "travel": "Not specified", "equipment": "Not specified", "materials": "Not specified", "personnel": "Not specified"}, "payment_schedule": {"milestones": [], "installments": [{"amount": 3175000, "currency": "USD", "due_date": "2024-05-29", "description": "Payment upon receipt of countersigned Agreement", "installment_number": 1}, {"amount": 1500000, "currency": "USD", "due_date": "2025-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2025", "installment_number": 2}, {"amount": 1000190, "currency": "USD", "due_date": "2026-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2026", "installment_number": 3}, {"amount": 2000000, "currency": "USD", "due_date": "2027-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2027", "installment_number": 4}], "schedule_type": "Milestone-based"}, "total_grant_amount": 7675190}}, "submission_notes": "asdasdasdasdasd"}	Submitted for review: asdasdasdasdasd	review_submission
2	1	2	15	2026-02-18 15:00:50.145935+05:30	{"basic_data": {"status": "published", "grantee": "ABC Centre Ltd", "grantor": "Saple Foundation", "purpose": "To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.", "end_date": "2027-03-31", "grant_name": "Scaling unified Health Campaign Management in Africa", "start_date": "2024-05-10", "total_amount": 7675190.0, "contract_number": "INV-076000"}, "contract_data": {"parties": {"grantee": {"email": "james@abccentre.co.uk", "phone": "Not specified", "address": "11 St Cross Street, Hatton Garden, London EC1N 8UB, GBR", "contact_person": "James Bond", "signatory_name": "James Bond", "signature_date": "2024-05-10", "signatory_title": "Director", "organization_name": "ABC Centre Ltd"}, "grantor": {"email": "rose.whitefield@saple.org", "phone": "Not specified", "address": "1000 W. Maude Avenue, Sunnyvale, CA 94085, USA", "contact_person": "Rose Whitefield", "signatory_name": "Rose Whitefield", "signature_date": "2024-05-07", "signatory_title": "Senior Program Officer", "organization_name": "Saple Foundation"}}, "summary": {"risk_assessment": "No specific risk assessment found", "executive_summary": "Scaling unified Health Campaign Management in Africa between Saple Foundation and ABC Centre Ltd. Total grant amount: USD 7,675,190.00. Purpose: To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.. Deliverables: 2 items specified.", "financial_summary": "Total grant: USD 7,675,190.00 (4 installments)", "key_dates_summary": "Start: 2024-05-10; End: 2027-03-31; Signed: 2024-05-10"}, "metadata": {"document_type": "Grant Agreement", "extraction_timestamp": "2026-02-18T14:47:33.534274", "pages_extracted_from": 7, "extraction_confidence": 0.95}, "deliverables": {"items": [{"status": "pending", "due_date": "2025-01-31", "description": "Submission of progress reports demonstrating meaningful progress against targets or milestones.", "deliverable_name": "Progress Reports"}, {"status": "pending", "due_date": "2027-03-31", "description": "Development and deployment of a platform to assist Health Ministries in malaria endemic countries.", "deliverable_name": "Health Campaign Management Platform"}], "reporting_requirements": {"due_dates": ["2025-01-31", "2026-01-31", "2027-01-31", "2028-04-30"], "frequency": "Annually", "recipients": ["Rose Whitefield"], "report_types": ["Final Report", "Progress Report"], "submission_method": "Email or portal", "format_requirements": "Foundation's templates or forms"}}, "finalization": {"locked": true, "finalized_at": "2026-02-18T09:30:50.157318", "finalized_by": 15, "finalized_by_name": "testingpm"}, "extended_data": {"all_dates_found": [{"date": "March 31, 2027", "type": "Month DD, YYYY", "context": " Ministries in malaria endemic countries in Africa \\"Start Date\\": Date of last signature \\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment "}, {"date": "February 19, 2024", "type": "Month DD, YYYY", "context": "nd • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\""}, {"date": "February 18, 2024", "type": "Month DD, YYYY", "context": "y this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundatio"}, {"date": "May 7, 2024", "type": "Month DD, YYYY", "context": "2 / Rose Whitefield James Bond Title: /Title1Senior Program Officer/ Title: /Title2Director/ Date: 1May 7, 2024/ Date:MMay 10, 20242/ 1 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREE"}, {"date": "May 10, 2024", "type": "Month DD, YYYY", "context": " James Bond Title: /Title1Senior Program Officer/ Title: /Title2Director/ Date: 1May 7, 2024/ Date:MMay 10, 20242/ 1 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investment ID I"}, {"date": "January 31, 2025", "type": "Month DD, YYYY", "context": "eceived by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February"}, {"date": "January 31, 2026", "type": "Month DD, YYYY", "context": " to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of "}, {"date": "January 31, 2027", "type": "Month DD, YYYY", "context": " to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envel"}, {"date": "April 30, 2028", "type": "Month DD, YYYY", "context": "Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD2"}, {"date": "March 31, 2027", "type": "Month DD, YYYY", "context": " Ministries in malaria endemic countries in Africa \\"Start Date\\": Date of last signature \\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment "}, {"date": "February 19, 2024", "type": "Month DD, YYYY", "context": "nd • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\""}, {"date": "February 18, 2024", "type": "Month DD, YYYY", "context": "y this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundatio"}, {"date": "May 29, 2024", "type": "Month DD, YYYY", "context": "ting Deliverable | Due By | Payment Date | | Payment Amount (U.S.$) | | | Countersigned Agreement | May 29, 2024 | Within 15 days after receipt of countersigned Agreement if received by Due By date | | $3175000.0"}, {"date": "January 31, 2025", "type": "Month DD, YYYY", "context": "eceived by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February"}, {"date": "March 14, 2025", "type": "Month DD, YYYY", "context": "ived by Due By date | | $3175000.00 | Start of Investment to January 31, 2025 | | Progress Report | March 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14,"}, {"date": "February 1, 2025", "type": "Month DD, YYYY", "context": " Investment to January 31, 2025 | | Progress Report | March 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1,"}, {"date": "January 31, 2026", "type": "Month DD, YYYY", "context": " to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of "}, {"date": "March 14, 2026", "type": "Month DD, YYYY", "context": " 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14,"}, {"date": "February 1, 2026", "type": "Month DD, YYYY", "context": "ary 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14, 2027 | April 2027 | | $2000000.00 | Life of Inv"}, {"date": "January 31, 2027", "type": "Month DD, YYYY", "context": " to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envel"}, {"date": "March 14, 2027", "type": "Month DD, YYYY", "context": " 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14, 2027 | April 2027 | | $2000000.00 | Life of Investment | | Final Report | April 30, 2028 | | | | Total G"}, {"date": "April 30, 2028", "type": "Month DD, YYYY", "context": "Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD2"}], "signatures_found": [{"date": "Not specified", "name": "PAGE GRANTEE INFORMATION Name: ABC Centre Ltd Public Charity equivalent pursuant to U", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "\\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment Schedule (Attachment A) includes and • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundation\\"), and is effective as of date of last signature", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement May Within 15 days $3175000", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "by authorized representatives of both Parties", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Page, or as otherwise directed by the other Party", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "S Except as may be prohibited by applicable law or regulation, this Agreement and any amendment may be signed in counterparts, by facsimile, PDF, or other electronic means, each of which will be deemed an original and all of which when taken together will constitute one agreement", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "s will be binding for all purposes", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "| \\"End Date\\": | | March 31, 2027 | This Agreement includes and incorporates by this reference: | | This Agreement Summary & Signature Page and: • Grant Amount and Reporting & Payment Schedule (Attachment A) • Terms and Conditions (Attachment B) • Investment Document (date submitted February 19, 2024) • Budget (date submitted February 18, 2024) | REPORTING & PAYMENT SCHEDULE | | | | | | | Investment Period | | Target, Milestone, or Reporting Deliverable | Due By | Payment Date | | Payment Amount (U", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement | May 29, 2024 | Within 15 days after receipt of countersigned Agreement if received by Due By date | | $3175000", "title": "Not specified", "context": "Signature mentioned"}], "all_amounts_found": [{"type": "monetary_amount", "amount": 32.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 9.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 855.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 401.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 47.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 8.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 255.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 528.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 34.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 76.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 0.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 509.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 509.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 11.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 8.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 100.0, "context": "25 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2", "currency": "USD"}, {"type": "monetary_amount", "amount": 0.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 940.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 85.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 31.0, "context": "y Payment Date Payment Amount Period Deliverable (U.S.$) Countersigned Agreement May Within 15 days $3175000.00 29, 2024 after receipt of countersigned Agreement if received by Due By date Start of Progr", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 19.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 18.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 10.0, "context": "25 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 ", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 42.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 32.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 9.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}], "table_data_extracted": [], "deliverables_extracted_count": 2}, "reference_ids": {"grant_id": "AGREEMENT", "project_id": null, "investment_id": "INV-076000", "extracted_reference_ids": [{"type": "investment_id", "value": "INV-076000", "pattern": "Investment\\\\s*(?:ID|Number|No\\\\.?)[:\\\\s]*([A-Z0-9\\\\-/#]+)"}, {"type": "grant_id", "value": "AGREEMENT", "pattern": "GRANT[:\\\\s]+([A-Z0-9\\\\-/#]+)"}]}, "publish_history": [{"notes": "sads", "action": "final_published", "timestamp": "2026-02-18T09:30:50.157318", "by_user_id": 15, "by_user_name": "testingpm", "final_status": "published", "version_number": 2}], "contract_details": {"purpose": "To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.", "duration": "Approximately 3 years", "end_date": "2027-03-31", "grant_name": "Scaling unified Health Campaign Management in Africa", "objectives": ["Develop a health campaign management platform.", "Assist Health Ministries in malaria endemic countries."], "start_date": "2024-05-10", "scope_of_work": "The project involves the development and deployment of a health campaign management platform to support Health Ministries in Africa.", "agreement_type": "Grant Agreement", "effective_date": "2024-05-10", "signature_date": "2024-05-10", "contract_number": "INV-076000", "grant_reference": "INV-076000", "risk_management": "Not specified", "geographic_scope": "Africa", "detailed_scope_of_work": {"key_milestones": [], "main_activities": ["and manage the Project and the Funded Developments in a manner that ensures Global Access"], "timeline_phases": [], "deliverables_list": ["required under this Agreement", "| Due By | Payment Date | | Payment Amount (U", "the audit report to the Foundation upon request, including the management letter and a detailed plan for remedying any deficiencies observed (\\"Remediation Plan\\")"], "resources_required": [], "project_description": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMENT Investment ID INV-076000 AGREEMENT SUMMARY & SIGNATURE PAGE GRANTEE INFORMATION Name: ABC Centre Ltd Public Charity equivalent pursuant to U.S. IRC § 509(a)(1) or 509(a)(2) Tax Status: You confirm that the above information is correct and agree to notify the Foundation immediately of any change. Mailing Address: 11 St Cross Street, Hatton Garden, London EC1N 8UB, GBR Primary Contact: James Bo", "technical_requirements": []}}, "financial_details": {"currency": "USD", "budget_breakdown": {"other": "Not specified", "travel": "Not specified", "equipment": "Not specified", "materials": "Not specified", "personnel": "Not specified"}, "payment_schedule": {"milestones": [], "installments": [{"amount": 3175000, "currency": "USD", "due_date": "2024-05-29", "description": "Payment upon receipt of countersigned Agreement", "installment_number": 1}, {"amount": 1500000, "currency": "USD", "due_date": "2025-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2025", "installment_number": 2}, {"amount": 1000190, "currency": "USD", "due_date": "2026-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2026", "installment_number": 3}, {"amount": 2000000, "currency": "USD", "due_date": "2027-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2027", "installment_number": 4}], "schedule_type": "Milestone-based"}, "total_grant_amount": 7675190}}, "final_publish_data": {"notes": "sads", "published_at": "2026-02-18T09:30:50.157318", "published_by": 15, "published_by_name": "testingpm"}}	Final publication: sads	final_publish
\.


--
-- TOC entry 5311 (class 0 OID 125337)
-- Dependencies: 226
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (id, filename, uploaded_at, investment_id, project_id, grant_id, extracted_reference_ids, contract_number, grant_name, grantor, grantee, total_amount, start_date, end_date, purpose, payment_schedule, terms_conditions, comprehensive_data, full_text, status, processing_time, chroma_id, document_type, parent_contract_id, version, is_latest_version, amendment_status, amendment_date, amendment_reason, created_by, review_comments, review_status, review_summary, forwarded_by, forwarded_at, program_manager_recommendation, director_decision_status, director_decision_comments, director_decided_at, director_decided_by, business_sign_off, risk_accepted, is_locked, lock_reason, updated_at, assigned_pm_users, assigned_pgm_users, assigned_director_users, additional_documents, notes, agreement_type, effective_date, renewal_date, termination_date, jurisdiction, governing_law, special_conditions, last_edited_by, last_edited_at, published_at, published_by, first_name, last_name, company, user_type) FROM stdin;
1	INV-076000 Agreement.pdf	2026-02-18 14:47:30.970402+05:30	INV-076000	\N	AGREEMENT	[{"type": "investment_id", "value": "INV-076000", "pattern": "Investment\\\\s*(?:ID|Number|No\\\\.?)[:\\\\s]*([A-Z0-9\\\\-/#]+)"}, {"type": "grant_id", "value": "AGREEMENT", "pattern": "GRANT[:\\\\s]+([A-Z0-9\\\\-/#]+)"}]	INV-076000	Scaling unified Health Campaign Management in Africa	Saple Foundation	ABC Centre Ltd	7675190	2024-05-10	2027-03-31	To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.	{"milestones": [], "installments": [{"amount": 3175000, "currency": "USD", "due_date": "2024-05-29", "description": "Payment upon receipt of countersigned Agreement", "installment_number": 1}, {"amount": 1500000, "currency": "USD", "due_date": "2025-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2025", "installment_number": 2}, {"amount": 1000190, "currency": "USD", "due_date": "2026-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2026", "installment_number": 3}, {"amount": 2000000, "currency": "USD", "due_date": "2027-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2027", "installment_number": 4}], "schedule_type": "Milestone-based"}	{}	{"parties": {"grantee": {"email": "james@abccentre.co.uk", "phone": "Not specified", "address": "11 St Cross Street, Hatton Garden, London EC1N 8UB, GBR", "contact_person": "James Bond", "signatory_name": "James Bond", "signature_date": "2024-05-10", "signatory_title": "Director", "organization_name": "ABC Centre Ltd"}, "grantor": {"email": "rose.whitefield@saple.org", "phone": "Not specified", "address": "1000 W. Maude Avenue, Sunnyvale, CA 94085, USA", "contact_person": "Rose Whitefield", "signatory_name": "Rose Whitefield", "signature_date": "2024-05-07", "signatory_title": "Senior Program Officer", "organization_name": "Saple Foundation"}}, "summary": {"risk_assessment": "No specific risk assessment found", "executive_summary": "Scaling unified Health Campaign Management in Africa between Saple Foundation and ABC Centre Ltd. Total grant amount: USD 7,675,190.00. Purpose: To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.. Deliverables: 2 items specified.", "financial_summary": "Total grant: USD 7,675,190.00 (4 installments)", "key_dates_summary": "Start: 2024-05-10; End: 2027-03-31; Signed: 2024-05-10"}, "metadata": {"document_type": "Grant Agreement", "extraction_timestamp": "2026-02-18T14:47:33.534274", "pages_extracted_from": 7, "extraction_confidence": 0.95}, "deliverables": {"items": [{"status": "pending", "due_date": "2025-01-31", "description": "Submission of progress reports demonstrating meaningful progress against targets or milestones.", "deliverable_name": "Progress Reports"}, {"status": "pending", "due_date": "2027-03-31", "description": "Development and deployment of a platform to assist Health Ministries in malaria endemic countries.", "deliverable_name": "Health Campaign Management Platform"}], "reporting_requirements": {"due_dates": ["2025-01-31", "2026-01-31", "2027-01-31", "2028-04-30"], "frequency": "Annually", "recipients": ["Rose Whitefield"], "report_types": ["Final Report", "Progress Report"], "submission_method": "Email or portal", "format_requirements": "Foundation's templates or forms"}}, "extended_data": {"all_dates_found": [{"date": "March 31, 2027", "type": "Month DD, YYYY", "context": " Ministries in malaria endemic countries in Africa \\"Start Date\\": Date of last signature \\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment "}, {"date": "February 19, 2024", "type": "Month DD, YYYY", "context": "nd • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\""}, {"date": "February 18, 2024", "type": "Month DD, YYYY", "context": "y this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundatio"}, {"date": "May 7, 2024", "type": "Month DD, YYYY", "context": "2 / Rose Whitefield James Bond Title: /Title1Senior Program Officer/ Title: /Title2Director/ Date: 1May 7, 2024/ Date:MMay 10, 20242/ 1 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREE"}, {"date": "May 10, 2024", "type": "Month DD, YYYY", "context": " James Bond Title: /Title1Senior Program Officer/ Title: /Title2Director/ Date: 1May 7, 2024/ Date:MMay 10, 20242/ 1 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investment ID I"}, {"date": "January 31, 2025", "type": "Month DD, YYYY", "context": "eceived by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February"}, {"date": "January 31, 2026", "type": "Month DD, YYYY", "context": " to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of "}, {"date": "January 31, 2027", "type": "Month DD, YYYY", "context": " to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envel"}, {"date": "April 30, 2028", "type": "Month DD, YYYY", "context": "Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD2"}, {"date": "March 31, 2027", "type": "Month DD, YYYY", "context": " Ministries in malaria endemic countries in Africa \\"Start Date\\": Date of last signature \\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment "}, {"date": "February 19, 2024", "type": "Month DD, YYYY", "context": "nd • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\""}, {"date": "February 18, 2024", "type": "Month DD, YYYY", "context": "y this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundatio"}, {"date": "May 29, 2024", "type": "Month DD, YYYY", "context": "ting Deliverable | Due By | Payment Date | | Payment Amount (U.S.$) | | | Countersigned Agreement | May 29, 2024 | Within 15 days after receipt of countersigned Agreement if received by Due By date | | $3175000.0"}, {"date": "January 31, 2025", "type": "Month DD, YYYY", "context": "eceived by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February"}, {"date": "March 14, 2025", "type": "Month DD, YYYY", "context": "ived by Due By date | | $3175000.00 | Start of Investment to January 31, 2025 | | Progress Report | March 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14,"}, {"date": "February 1, 2025", "type": "Month DD, YYYY", "context": " Investment to January 31, 2025 | | Progress Report | March 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1,"}, {"date": "January 31, 2026", "type": "Month DD, YYYY", "context": " to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of "}, {"date": "March 14, 2026", "type": "Month DD, YYYY", "context": " 14, 2025 | April 2025 | | $1500000.00 | February 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14,"}, {"date": "February 1, 2026", "type": "Month DD, YYYY", "context": "ary 1, 2025 to January 31, 2026 | | Progress Report | March 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14, 2027 | April 2027 | | $2000000.00 | Life of Inv"}, {"date": "January 31, 2027", "type": "Month DD, YYYY", "context": " to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envel"}, {"date": "March 14, 2027", "type": "Month DD, YYYY", "context": " 14, 2026 | April 2026 | | $1000190.00 | February 1, 2026 to January 31, 2027 | | Progress Report | March 14, 2027 | April 2027 | | $2000000.00 | Life of Investment | | Final Report | April 30, 2028 | | | | Total G"}, {"date": "April 30, 2028", "type": "Month DD, YYYY", "context": "Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD2"}], "signatures_found": [{"date": "Not specified", "name": "PAGE GRANTEE INFORMATION Name: ABC Centre Ltd Public Charity equivalent pursuant to U", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "\\"End Date\\": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment Schedule (Attachment A) includes and • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd (\\"You\\" or \\"Grantee\\") and the Saple Foundation (\\"Foundation\\"), and is effective as of date of last signature", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement May Within 15 days $3175000", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "by authorized representatives of both Parties", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Page, or as otherwise directed by the other Party", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "S Except as may be prohibited by applicable law or regulation, this Agreement and any amendment may be signed in counterparts, by facsimile, PDF, or other electronic means, each of which will be deemed an original and all of which when taken together will constitute one agreement", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "s will be binding for all purposes", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "| \\"End Date\\": | | March 31, 2027 | This Agreement includes and incorporates by this reference: | | This Agreement Summary & Signature Page and: • Grant Amount and Reporting & Payment Schedule (Attachment A) • Terms and Conditions (Attachment B) • Investment Document (date submitted February 19, 2024) • Budget (date submitted February 18, 2024) | REPORTING & PAYMENT SCHEDULE | | | | | | | Investment Period | | Target, Milestone, or Reporting Deliverable | Due By | Payment Date | | Payment Amount (U", "title": "Not specified", "context": "Signature mentioned"}, {"date": "Not specified", "name": "Agreement | May 29, 2024 | Within 15 days after receipt of countersigned Agreement if received by Due By date | | $3175000", "title": "Not specified", "context": "Signature mentioned"}], "all_amounts_found": [{"type": "monetary_amount", "amount": 32.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 9.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 855.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 401.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 47.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 8.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 255.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 528.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 34.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 76.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 0.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 509.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 509.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 11.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 8.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 100.0, "context": "25 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2", "currency": "USD"}, {"type": "monetary_amount", "amount": 0.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 940.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 85.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 31.0, "context": "y Payment Date Payment Amount Period Deliverable (U.S.$) Countersigned Agreement May Within 15 days $3175000.00 29, 2024 after receipt of countersigned Agreement if received by Due By date Start of Progr", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 19.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 18.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 2.0, "context": "ril 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant A", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 4.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}, {"type": "monetary_amount", "amount": 10.0, "context": "25 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2000000.00 ", "currency": "USD"}, {"type": "monetary_amount", "amount": 202.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMEN", "currency": "USD"}, {"type": "monetary_amount", "amount": 42.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 1.0, "context": "of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1500000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1000", "currency": "USD"}, {"type": "monetary_amount", "amount": 7.0, "context": ".00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7675190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investme", "currency": "USD"}, {"type": "monetary_amount", "amount": 32.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEME", "currency": "USD"}, {"type": "monetary_amount", "amount": 9.0, "context": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEM", "currency": "USD"}], "table_data_extracted": [], "deliverables_extracted_count": 2}, "reference_ids": {"grant_id": "AGREEMENT", "project_id": null, "investment_id": "INV-076000", "extracted_reference_ids": [{"type": "investment_id", "value": "INV-076000", "pattern": "Investment\\\\s*(?:ID|Number|No\\\\.?)[:\\\\s]*([A-Z0-9\\\\-/#]+)"}, {"type": "grant_id", "value": "AGREEMENT", "pattern": "GRANT[:\\\\s]+([A-Z0-9\\\\-/#]+)"}]}, "contract_details": {"purpose": "To build and make available a health campaign management platform to assist Health Ministries in malaria endemic countries in Africa.", "duration": "Approximately 3 years", "end_date": "2027-03-31", "grant_name": "Scaling unified Health Campaign Management in Africa", "objectives": ["Develop a health campaign management platform.", "Assist Health Ministries in malaria endemic countries."], "start_date": "2024-05-10", "scope_of_work": "The project involves the development and deployment of a health campaign management platform to support Health Ministries in Africa.", "agreement_type": "Grant Agreement", "effective_date": "2024-05-10", "signature_date": "2024-05-10", "contract_number": "INV-076000", "grant_reference": "INV-076000", "risk_management": "Not specified", "geographic_scope": "Africa", "detailed_scope_of_work": {"key_milestones": [], "main_activities": ["and manage the Project and the Funded Developments in a manner that ensures Global Access"], "timeline_phases": [], "deliverables_list": ["required under this Agreement", "| Due By | Payment Date | | Payment Amount (U", "the audit report to the Foundation upon request, including the management letter and a detailed plan for remedying any deficiencies observed (\\"Remediation Plan\\")"], "resources_required": [], "project_description": "[TABLE ROW]: DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMENT Investment ID INV-076000 AGREEMENT SUMMARY & SIGNATURE PAGE GRANTEE INFORMATION Name: ABC Centre Ltd Public Charity equivalent pursuant to U.S. IRC § 509(a)(1) or 509(a)(2) Tax Status: You confirm that the above information is correct and agree to notify the Foundation immediately of any change. Mailing Address: 11 St Cross Street, Hatton Garden, London EC1N 8UB, GBR Primary Contact: James Bo", "technical_requirements": []}}, "financial_details": {"currency": "USD", "budget_breakdown": {"other": "Not specified", "travel": "Not specified", "equipment": "Not specified", "materials": "Not specified", "personnel": "Not specified"}, "payment_schedule": {"milestones": [], "installments": [{"amount": 3175000, "currency": "USD", "due_date": "2024-05-29", "description": "Payment upon receipt of countersigned Agreement", "installment_number": 1}, {"amount": 1500000, "currency": "USD", "due_date": "2025-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2025", "installment_number": 2}, {"amount": 1000190, "currency": "USD", "due_date": "2026-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2026", "installment_number": 3}, {"amount": 2000000, "currency": "USD", "due_date": "2027-04-15", "description": "Payment upon submission of Progress Report for period ending January 31, 2027", "installment_number": 4}], "schedule_type": "Milestone-based"}, "total_grant_amount": 7675190}}	DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 Saple Foundation GRANT AGREEMENT Investment ID INV-076000 AGREEMENT SUMMARY & SIGNATURE PAGE GRANTEE INFORMATION Name: ABC Centre Ltd Public Charity equivalent pursuant to U.S. IRC § 509(a)(1) or 509(a)(2) Tax Status: You confirm that the above information is correct and agree to notify the Foundation immediately of any change. Mailing Address: 11 St Cross Street, Hatton Garden, London EC1N 8UB, GBR Primary Contact: James Bond, Director, james@abccentre.co.uk FOUNDATION INFORMATION Mailing Address: 1000 W. Maude Avenue, Sunnyvale, CA 94085, USA Primary Contact: Rose Whitefield, Senior Program Officer, Malaria, rose.whitefield@saple.org AGREEMENT INFORMATION Title: Scaling unified Health Campaign Management in Africa to build and make available a health campaign management platform to assist the “Charitable Purpose": Health Ministries in malaria endemic countries in Africa "Start Date": Date of last signature "End Date": March 31, 2027 This Agreement Summary & Signature Page and: This Agreement • Grant Amount and Reporting & Payment Schedule (Attachment A) includes and • Terms and Conditions (Attachment B) incorporates by this • Investment Document (date submitted February 19, 2024) reference: • Budget (date submitted February 18, 2024) THIS AGREEMENT is between ABC Centre Ltd ("You" or "Grantee") and the Saple Foundation ("Foundation"), and is effective as of date of last signature. Each party to this Agreement may be referred to individually as a "Party" and together as the "Parties." As a condition of this grant, the Parties enter into this Agreement by having their authorized representatives sign below. SAPLE FOUNDATION ABC CENTRE LTD Rose White/f ie ld / James Bon/d By: /Name1 / By: / Name2 / Rose Whitefield James Bond Title: /Title1Senior Program Officer/ Title: /Title2Director/ Date: 1May 7, 2024/ Date:MMay 10, 20242/ 1 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investment ID INV-076000 ATTACHMENT A GRANT AMOUNT AND REPORTING & PAYMENT SCHEDULE GRANT AMOUNT The Foundation will pay You the total grant amount specified in the Reporting & Payment Schedule below. The Foundation's Primary Contact must approve in writing any Budget cost category change of more than 10%. REPORTING & PAYMENT SCHEDULE Payments are subject to Your compliance with this Agreement, including Your achievement, and the Foundation's approval, of any applicable targets, milestones, and reporting deliverables required under this Agreement. The Foundation may, in its reasonable discretion, modify payment dates or amounts and will notify You of any such changes in writing. REPORTING You will submit reports according to the Reporting & Payment Schedule using the Foundation's templates or forms, which the Foundation will make available to You and which may be modified from time to time. For a progress or final report to be considered satisfactory, it must demonstrate meaningful progress against the targets or milestones for that investment period. If meaningful progress has not been made, the report should explain why not and what adjustments You are making to get back on track. Please notify the Foundation's Primary Contact if You need to add or modify any targets or milestones. The Foundation must approve any such changes in writing. You agree to submit other reports the Foundation may reasonably request. REPORTING & PAYMENT SCHEDULE Investment Target, Milestone, or Reporting Due By Payment Date Payment Amount Period Deliverable (U.S.$) Countersigned Agreement May Within 15 days $3,175,000.00 29, 2024 after receipt of countersigned Agreement if received by Due By date Start of Progress Report March 14, April 2025 $1,500,000.00 Investment to 2025 January 31, 2025 February 1, Progress Report March 14, April 2026 $1,000,190.00 2025 to 2026 January 31, 2026 February 1, Progress Report March 14, April 2027 $2,000,000.00 2026 to 2027 January 31, 2027 Life of Final Report April 30, 2028 Investment Total Grant Amount $7,675,190.00 2 of 7 DocuSign Envelope ID: 32C9C1B2-8554-4014-AE47-8AD255A52834 GRANT AGREEMENT Investment ID INV-076000 ATTACHMENT B TERMS & CONDITIONS This Agreement is subject to the following terms and conditions. PROJECT SUPPORT PROJECT DESCRIPTION AND CHARITABLE PURPOSE The Foundation is awarding You this grant to carry out the project described in the Investment Document ("Project") in order to further the Charitable Purpose. The Foundation, in its discretion, may approve in writing any request by You to make non-material changes to the Investment Document. MANAGEMENT OF FUNDS USE OF FUNDS You may not use funds provided under this Agreement ("Grant Funds") for any purpose other than the Project. You may not use Grant Funds to reimburse any expenses You incurred prior to the Start Date. At the Foundation's request, You will repay any portion of Grant Funds and/or Income used or committed in material breach of this Agreement, as dete	published	\N	contract_1	main_contract	\N	2	t	draft	\N	\N	15	Program Manager Review by testingpgm on 2026-02-18 09:18:40:\nRecommendation: approve\nSummary: adasd\n\n\nDIRECTOR APPROVAL: APPROVE\nApproved by: testingdir\nApproved at: 2026-02-18 09:30:31\nComments: asdasd\nRisk Accepted: No\nBusiness Sign-off: No\nContract Locked: No	pending_review	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	\N	2026-02-18 14:47:30.970402+05:30	[15]	[18]	[17]	[]	sads	\N	\N	\N	\N	\N	\N	\N	15	2026-02-18 09:18:02.674682+05:30	2026-02-18 09:30:50.150533+05:30	15	\N	\N	\N	internal
\.


--
-- TOC entry 5305 (class 0 OID 125169)
-- Dependencies: 220
-- Data for Name: extraction_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extraction_logs (id, contract_id, extraction_type, field_name, extracted_value, confidence_score, "timestamp", parent_contract_id, previous_value) FROM stdin;
\.


--
-- TOC entry 5331 (class 0 OID 166534)
-- Dependencies: 246
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (id, name, description, is_active, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 5339 (class 0 OID 184510)
-- Dependencies: 254
-- Data for Name: reporting_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reporting_events (id, contract_id, report_type, due_date, status, uploaded_file_path, submitted_at, created_at, uploaded_file_name, uploaded_at, pgm_approved, pgm_approved_at, pgm_approved_by, director_approved, director_approved_at) FROM stdin;
1	1	Progress Report	2025-01-31	pending	\N	\N	2026-02-18 09:17:36.830599	\N	\N	f	\N	\N	f	\N
2	1	Progress Report	2026-01-31	pending	\N	\N	2026-02-18 09:17:36.830599	\N	\N	f	\N	\N	f	\N
3	1	Progress Report	2027-01-31	pending	\N	\N	2026-02-18 09:17:36.830599	\N	\N	f	\N	\N	f	\N
4	1	Final Report	2028-04-30	pending	\N	\N	2026-02-18 09:17:36.830599	\N	\N	f	\N	\N	f	\N
\.


--
-- TOC entry 5337 (class 0 OID 184494)
-- Dependencies: 252
-- Data for Name: reporting_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reporting_schedules (id, contract_id, frequency, report_types, due_dates, format_requirements, submission_method, recipients, created_at) FROM stdin;
1	1	Annually	["Final Report", "Progress Report"]	["2025-01-31", "2026-01-31", "2027-01-31", "2028-04-30"]	Foundation's templates or forms	Email or portal	["Rose Whitefield"]	2026-02-18 09:17:36.818633
\.


--
-- TOC entry 5321 (class 0 OID 125489)
-- Dependencies: 236
-- Data for Name: review_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review_comments (id, contract_id, user_id, comment_type, comment, status, flagged_risk, flagged_issue, change_request, recommendation, resolution_response, resolved_by, resolved_at, created_at, parent_comment_id, thread_id, is_resolution) FROM stdin;
1	1	15	project_manager_submission	asdasdasdasdasd	open	f	f	\N	\N	\N	\N	\N	2026-02-18 14:48:06.576413+05:30	\N	\N	f
\.


--
-- TOC entry 5333 (class 0 OID 166552)
-- Dependencies: 248
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role, module_id, permission, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 5342 (class 0 OID 204121)
-- Dependencies: 257
-- Data for Name: tenant_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_modules (id, tenant_id, module_key, is_enabled, created_at) FROM stdin;
\.


--
-- TOC entry 5340 (class 0 OID 204110)
-- Dependencies: 255
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, name, domain, setup_completed, is_active, created_at, workflow_config, ai_config) FROM stdin;
\.


--
-- TOC entry 5335 (class 0 OID 174692)
-- Dependencies: 250
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_notifications (id, user_id, notification_type, title, message, contract_id, is_read, created_at, read_at) FROM stdin;
1	15	project_manager_assigned	New Assignment	You have been assigned to contract 'Scaling unified Health Campaign Management in Africa' by testingpm	1	f	2026-02-18 09:18:02.671682+05:30	\N
2	18	program_manager_assigned	New Assignment	You have been assigned to contract 'Scaling unified Health Campaign Management in Africa' by testingpm	1	f	2026-02-18 09:18:02.673683+05:30	\N
3	17	director_assigned	New Assignment	You have been assigned to contract 'Scaling unified Health Campaign Management in Africa' by testingpm	1	f	2026-02-18 09:18:02.674682+05:30	\N
4	17	director_assigned	New Assignment	You have been assigned to contract 'Scaling unified Health Campaign Management in Africa' by testingpm	1	f	2026-02-18 09:18:02.674682+05:30	\N
5	18	agreement_published	New Contract for Review	Contract 'Scaling unified Health Campaign Management in Africa' has been submitted for review by testingpm	1	f	2026-02-18 09:18:06.585685+05:30	\N
6	18	director_decision	Director Approved Contract	Contract 'Scaling unified Health Campaign Management in Africa' has been approved by Director testingdir. Comments: asdasd	1	f	2026-02-18 09:30:31.067696+05:30	\N
7	15	contract_finalized	Contract Approved by Director	Your contract 'Scaling unified Health Campaign Management in Africa' has been approved by Director testingdir.	1	f	2026-02-18 09:30:31.068709+05:30	\N
\.


--
-- TOC entry 5309 (class 0 OID 125316)
-- Dependencies: 224
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, session_token, created_at, expires_at, ip_address, user_agent) FROM stdin;
\.


--
-- TOC entry 5307 (class 0 OID 125295)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, full_name, role, created_at, last_login, is_active, department, phone, first_name, last_name, company, user_type) FROM stdin;
2	pgm1	pgm1@grantanalyzer.com	$2b$12$1BQLpW8JFWJO54Le20T3we7hZ8DU6sYBBABtpbCaZJ3Gc57fKt4Iy	Program Manager One	program_manager	2026-01-22 10:40:13.801285+05:30	2026-02-10 05:14:57.564932+05:30	t	Program Management	\N	\N	\N	\N	internal
10	123	123@saple.ai	$2b$12$QhnvLKVXKOxijVIeJt94vuyIl6kKXq2/3ElRBeCjjBwWVe..ezpMG	\N	project_manager	2026-02-05 15:38:32.150236+05:30	2026-02-08 05:36:16.654717+05:30	t	IT	9898989898	123	456	saple	internal
1	pm1	pm1@grantanalyzer.com	$2b$12$YDdIrez.TPDSGdUFDY9JReodeEO1qyd4EExxgEmmu818izVIJu39K	Project Manager One	project_manager	2026-01-22 10:40:13.801285+05:30	2026-02-11 05:40:00.400588+05:30	t	Projects	\N	\N	\N	\N	internal
8	maddy	mukthar@saple.ai	$2b$12$Gno2NEl9Yer4ADIvfUSLg.2R66sjf7AnuYshekn.fk1HQbvS5/SZ2	\N	project_manager	2026-02-05 15:34:16.581457+05:30	2026-02-05 10:04:29.548775+05:30	t	IT	9898989898	mohamed	mukthar	saple	internal
14	dir2	dir2@grantos.com	$2b$12$IfQ97yAbKhCEIf/S1pkEL.sMnm8TRjUMevf1Tbrow38LstUG7W.5O	\N	director	2026-02-08 21:19:07.504678+05:30	2026-02-08 17:16:59.220698+05:30	t	IT	9898989898	dir	2	grantos	internal
17	testingdir	testingdir@grantos.com	$2b$12$b/LDudTStpq3GvYYPz/AbONXD4aP1/XXAEG8wniQj09./GvXKwwFy	\N	director	2026-02-09 08:50:11.787864+05:30	2026-02-18 09:30:35.440352+05:30	t	IT	9898989898	testing	dir	grantOS	internal
13	chand	chand@saple.ai	$2b$12$s1Rq1hBWpJ6uzWvHGv/KyuNp4VHzxTMowWUeyyIvNoP5mBv9zFBWy	\N	project_manager	2026-02-06 11:06:45.86685+05:30	2026-02-07 11:33:43.978733+05:30	t	Director	8989898989	chand	saple.ai	saple.ai	internal
9	maddy2	maddy@saple.ai	$2b$12$i8Dm98ssYcYkhOtF/xBwzuBStAkchT/yPoN07qKBuyAJfqGZkduLC	\N	project_manager	2026-02-05 15:37:37.240585+05:30	\N	t	IT	9898989898	mohamed	mukthar	saple	internal
7	superadmin	superadmin@grantos.com	$2b$12$SaKvumzsKwhSKy0vjYYAj.2IzmpDezQbJZRB2bXugLEEvIs53xxna	\N	super_admin	2026-02-05 10:00:13.950979+05:30	2026-02-09 05:06:08.047569+05:30	t	\N	\N	Super	Admin	\N	internal
11	456	456@saple.ai	$2b$12$aGn3sHbAu8eAFganhMcTw.wJpzVtYq4Ork6ulbp3VW53arE8JZsYm	\N	program_manager	2026-02-05 15:42:21.115868+05:30	2026-02-08 15:46:10.594745+05:30	t	IT	7878787878	456	456	456	internal
12	789	789@saple.ai	$2b$12$0.9DbHiGUi9yEWhPCbA.BegF6DWgcGBarRfXO1ZxKdDRD4UtmGG8i	\N	project_manager	2026-02-05 15:43:51.837056+05:30	2026-02-07 05:41:36.774343+05:30	t	IT	7878787878	789	789	789	internal
3	dir1	dir1@grantanalyzer.com	$2b$12$KBy98mSRWLXH/I4DKnNgjeIXyBLclR9xSBv./hpDA3G.5i5cdL8XW	Director One	director	2026-01-22 10:40:13.801285+05:30	2026-02-10 05:15:23.139907+05:30	t	Leadership	\N	\N	\N	\N	internal
18	testingpgm	testingpgm@grantos.com	$2b$12$dyCFKNvNXtl2bSU7OeEi4up3ZcoZzX116wiSNlRkBz6Rv4qqRDbdm	\N	program_manager	2026-02-09 10:36:07.714658+05:30	2026-02-18 09:30:15.414383+05:30	t	h	98765423	testing	pgm	asdasdasda	internal
15	testingpm	testingpm@grantos.com	$2b$12$7/6oS7ovMmv3FfuMz4BnRefKQnMdJ/JHPfFBxSF4Q3/jFAhltGmdW	\N	project_manager	2026-02-09 08:48:21.323123+05:30	2026-02-18 09:33:23.00082+05:30	t	IT	9876549876	testing	pm	grantOS	internal
\.


--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 231
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 55, true);


--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 227
-- Name: amendment_comparisons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.amendment_comparisons_id_seq', 1, false);


--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 241
-- Name: comment_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_attachments_id_seq', 1, false);


--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 239
-- Name: comment_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_reactions_id_seq', 1, false);


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 237
-- Name: comment_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comment_tags_id_seq', 1, false);


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 243
-- Name: contract_deliverables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contract_deliverables_id_seq', 1, false);


--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 229
-- Name: contract_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contract_permissions_id_seq', 1, false);


--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 233
-- Name: contract_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contract_versions_id_seq', 2, true);


--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 225
-- Name: contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contracts_id_seq', 1, true);


--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 219
-- Name: extraction_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.extraction_logs_id_seq', 1, false);


--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 245
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modules_id_seq', 1, false);


--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 253
-- Name: reporting_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reporting_events_id_seq', 4, true);


--
-- TOC entry 5379 (class 0 OID 0)
-- Dependencies: 251
-- Name: reporting_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reporting_schedules_id_seq', 1, true);


--
-- TOC entry 5380 (class 0 OID 0)
-- Dependencies: 235
-- Name: review_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_comments_id_seq', 1, true);


--
-- TOC entry 5381 (class 0 OID 0)
-- Dependencies: 247
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 1, false);


--
-- TOC entry 5382 (class 0 OID 0)
-- Dependencies: 256
-- Name: tenant_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenant_modules_id_seq', 1, false);


--
-- TOC entry 5383 (class 0 OID 0)
-- Dependencies: 249
-- Name: user_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_notifications_id_seq', 7, true);


--
-- TOC entry 5384 (class 0 OID 0)
-- Dependencies: 223
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- TOC entry 5385 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- TOC entry 5064 (class 2606 OID 125427)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5055 (class 2606 OID 125378)
-- Name: amendment_comparisons amendment_comparisons_amendment_id_parent_contract_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons
    ADD CONSTRAINT amendment_comparisons_amendment_id_parent_contract_id_key UNIQUE (amendment_id, parent_contract_id);


--
-- TOC entry 5057 (class 2606 OID 125376)
-- Name: amendment_comparisons amendment_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons
    ADD CONSTRAINT amendment_comparisons_pkey PRIMARY KEY (id);


--
-- TOC entry 5089 (class 2606 OID 125590)
-- Name: comment_attachments comment_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT comment_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 5084 (class 2606 OID 125566)
-- Name: comment_reactions comment_reactions_comment_id_user_id_reaction_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_comment_id_user_id_reaction_type_key UNIQUE (comment_id, user_id, reaction_type);


--
-- TOC entry 5086 (class 2606 OID 125564)
-- Name: comment_reactions comment_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5081 (class 2606 OID 125542)
-- Name: comment_tags comment_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_tags
    ADD CONSTRAINT comment_tags_pkey PRIMARY KEY (id);


--
-- TOC entry 5092 (class 2606 OID 166372)
-- Name: contract_deliverables contract_deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_deliverables
    ADD CONSTRAINT contract_deliverables_pkey PRIMARY KEY (id);


--
-- TOC entry 5061 (class 2606 OID 125400)
-- Name: contract_permissions contract_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions
    ADD CONSTRAINT contract_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5067 (class 2606 OID 125475)
-- Name: contract_versions contract_versions_contract_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_contract_id_version_number_key UNIQUE (contract_id, version_number);


--
-- TOC entry 5069 (class 2606 OID 125473)
-- Name: contract_versions contract_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 5034 (class 2606 OID 125352)
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- TOC entry 5015 (class 2606 OID 125178)
-- Name: extraction_logs extraction_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extraction_logs
    ADD CONSTRAINT extraction_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5095 (class 2606 OID 166545)
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- TOC entry 5111 (class 2606 OID 184521)
-- Name: reporting_events reporting_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_events
    ADD CONSTRAINT reporting_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5108 (class 2606 OID 184502)
-- Name: reporting_schedules reporting_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_schedules
    ADD CONSTRAINT reporting_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 5079 (class 2606 OID 125505)
-- Name: review_comments review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5097 (class 2606 OID 166563)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5099 (class 2606 OID 166565)
-- Name: role_permissions role_permissions_role_module_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_module_id_permission_key UNIQUE (role, module_id, permission);


--
-- TOC entry 5118 (class 2606 OID 204130)
-- Name: tenant_modules tenant_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_modules
    ADD CONSTRAINT tenant_modules_pkey PRIMARY KEY (id);


--
-- TOC entry 5113 (class 2606 OID 204119)
-- Name: tenants tenants_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_domain_key UNIQUE (domain);


--
-- TOC entry 5115 (class 2606 OID 204117)
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- TOC entry 5105 (class 2606 OID 174705)
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5030 (class 2606 OID 125328)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5032 (class 2606 OID 125330)
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- TOC entry 5022 (class 2606 OID 125314)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5024 (class 2606 OID 125310)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5026 (class 2606 OID 125312)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5065 (class 1259 OID 125452)
-- Name: idx_activity_logs_user_contract; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_user_contract ON public.activity_logs USING btree (user_id, contract_id);


--
-- TOC entry 5058 (class 1259 OID 125447)
-- Name: idx_amendment_comparisons_amendment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_amendment_comparisons_amendment_id ON public.amendment_comparisons USING btree (amendment_id);


--
-- TOC entry 5059 (class 1259 OID 125448)
-- Name: idx_amendment_comparisons_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_amendment_comparisons_parent_id ON public.amendment_comparisons USING btree (parent_contract_id);


--
-- TOC entry 5090 (class 1259 OID 125603)
-- Name: idx_comment_attachments_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comment_attachments_comment_id ON public.comment_attachments USING btree (comment_id);


--
-- TOC entry 5087 (class 1259 OID 125602)
-- Name: idx_comment_reactions_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comment_reactions_comment_id ON public.comment_reactions USING btree (comment_id);


--
-- TOC entry 5082 (class 1259 OID 125601)
-- Name: idx_comment_tags_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comment_tags_comment_id ON public.comment_tags USING btree (comment_id);


--
-- TOC entry 5062 (class 1259 OID 125451)
-- Name: idx_contract_permissions_user_contract; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_permissions_user_contract ON public.contract_permissions USING btree (user_id, contract_id);


--
-- TOC entry 5070 (class 1259 OID 125486)
-- Name: idx_contract_versions_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_versions_contract_id ON public.contract_versions USING btree (contract_id);


--
-- TOC entry 5071 (class 1259 OID 125487)
-- Name: idx_contract_versions_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contract_versions_created_by ON public.contract_versions USING btree (created_by);


--
-- TOC entry 5035 (class 1259 OID 166599)
-- Name: idx_contracts_assigned_director_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_assigned_director_users ON public.contracts USING gin (assigned_director_users);


--
-- TOC entry 5036 (class 1259 OID 166598)
-- Name: idx_contracts_assigned_pgm_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_assigned_pgm_users ON public.contracts USING gin (assigned_pgm_users);


--
-- TOC entry 5037 (class 1259 OID 166597)
-- Name: idx_contracts_assigned_pm_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_assigned_pm_users ON public.contracts USING gin (assigned_pm_users);


--
-- TOC entry 5038 (class 1259 OID 125609)
-- Name: idx_contracts_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_created_by ON public.contracts USING btree (created_by);


--
-- TOC entry 5039 (class 1259 OID 125629)
-- Name: idx_contracts_director_decision_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_director_decision_status ON public.contracts USING btree (director_decision_status);


--
-- TOC entry 5040 (class 1259 OID 125440)
-- Name: idx_contracts_document_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_document_type ON public.contracts USING btree (document_type);


--
-- TOC entry 5041 (class 1259 OID 125628)
-- Name: idx_contracts_forwarded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_forwarded_by ON public.contracts USING btree (forwarded_by);


--
-- TOC entry 5042 (class 1259 OID 125441)
-- Name: idx_contracts_grant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_grant_id ON public.contracts USING btree (grant_id);


--
-- TOC entry 5043 (class 1259 OID 125442)
-- Name: idx_contracts_investment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_investment_id ON public.contracts USING btree (investment_id);


--
-- TOC entry 5044 (class 1259 OID 166595)
-- Name: idx_contracts_last_edited_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_last_edited_by ON public.contracts USING btree (last_edited_by);


--
-- TOC entry 5045 (class 1259 OID 125443)
-- Name: idx_contracts_parent_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_parent_contract_id ON public.contracts USING btree (parent_contract_id);


--
-- TOC entry 5046 (class 1259 OID 125630)
-- Name: idx_contracts_program_manager_recommendation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_program_manager_recommendation ON public.contracts USING btree (program_manager_recommendation);


--
-- TOC entry 5047 (class 1259 OID 125444)
-- Name: idx_contracts_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_project_id ON public.contracts USING btree (project_id);


--
-- TOC entry 5048 (class 1259 OID 166596)
-- Name: idx_contracts_published_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_published_by ON public.contracts USING btree (published_by);


--
-- TOC entry 5049 (class 1259 OID 125627)
-- Name: idx_contracts_review_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_review_status ON public.contracts USING btree (review_status);


--
-- TOC entry 5050 (class 1259 OID 125610)
-- Name: idx_contracts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);


--
-- TOC entry 5051 (class 1259 OID 166594)
-- Name: idx_contracts_status_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status_created_by ON public.contracts USING btree (status, created_by);


--
-- TOC entry 5052 (class 1259 OID 125445)
-- Name: idx_contracts_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_version ON public.contracts USING btree (version);


--
-- TOC entry 5016 (class 1259 OID 125203)
-- Name: idx_extraction_logs_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_extraction_logs_parent_id ON public.extraction_logs USING btree (parent_contract_id);


--
-- TOC entry 5072 (class 1259 OID 125521)
-- Name: idx_review_comments_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_contract_id ON public.review_comments USING btree (contract_id);


--
-- TOC entry 5073 (class 1259 OID 125524)
-- Name: idx_review_comments_flagged; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_flagged ON public.review_comments USING btree (flagged_risk, flagged_issue);


--
-- TOC entry 5074 (class 1259 OID 125605)
-- Name: idx_review_comments_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_parent ON public.review_comments USING btree (parent_comment_id);


--
-- TOC entry 5075 (class 1259 OID 125523)
-- Name: idx_review_comments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_status ON public.review_comments USING btree (status);


--
-- TOC entry 5076 (class 1259 OID 125604)
-- Name: idx_review_comments_thread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_thread ON public.review_comments USING btree (thread_id);


--
-- TOC entry 5077 (class 1259 OID 125522)
-- Name: idx_review_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_comments_user_id ON public.review_comments USING btree (user_id);


--
-- TOC entry 5100 (class 1259 OID 174719)
-- Name: idx_user_notifications_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_contract_id ON public.user_notifications USING btree (contract_id);


--
-- TOC entry 5101 (class 1259 OID 174720)
-- Name: idx_user_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_is_read ON public.user_notifications USING btree (is_read);


--
-- TOC entry 5102 (class 1259 OID 174718)
-- Name: idx_user_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);


--
-- TOC entry 5027 (class 1259 OID 125449)
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);


--
-- TOC entry 5028 (class 1259 OID 125450)
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- TOC entry 5019 (class 1259 OID 125438)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5020 (class 1259 OID 125439)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 5093 (class 1259 OID 166383)
-- Name: ix_contract_deliverables_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_contract_deliverables_id ON public.contract_deliverables USING btree (id);


--
-- TOC entry 5053 (class 1259 OID 125446)
-- Name: ix_contracts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_contracts_id ON public.contracts USING btree (id);


--
-- TOC entry 5017 (class 1259 OID 125204)
-- Name: ix_extraction_logs_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_extraction_logs_contract_id ON public.extraction_logs USING btree (contract_id);


--
-- TOC entry 5018 (class 1259 OID 125205)
-- Name: ix_extraction_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_extraction_logs_id ON public.extraction_logs USING btree (id);


--
-- TOC entry 5109 (class 1259 OID 184532)
-- Name: ix_reporting_events_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reporting_events_id ON public.reporting_events USING btree (id);


--
-- TOC entry 5106 (class 1259 OID 184508)
-- Name: ix_reporting_schedules_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reporting_schedules_id ON public.reporting_schedules USING btree (id);


--
-- TOC entry 5116 (class 1259 OID 204136)
-- Name: ix_tenant_modules_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tenant_modules_id ON public.tenant_modules USING btree (id);


--
-- TOC entry 5103 (class 1259 OID 174716)
-- Name: ix_user_notifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_notifications_id ON public.user_notifications USING btree (id);


--
-- TOC entry 5132 (class 2606 OID 125433)
-- Name: activity_logs activity_logs_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- TOC entry 5133 (class 2606 OID 125428)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5127 (class 2606 OID 125379)
-- Name: amendment_comparisons amendment_comparisons_amendment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons
    ADD CONSTRAINT amendment_comparisons_amendment_id_fkey FOREIGN KEY (amendment_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- TOC entry 5128 (class 2606 OID 125384)
-- Name: amendment_comparisons amendment_comparisons_parent_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amendment_comparisons
    ADD CONSTRAINT amendment_comparisons_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 125591)
-- Name: comment_attachments comment_attachments_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT comment_attachments_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.review_comments(id) ON DELETE CASCADE;


--
-- TOC entry 5145 (class 2606 OID 125596)
-- Name: comment_attachments comment_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_attachments
    ADD CONSTRAINT comment_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- TOC entry 5142 (class 2606 OID 125567)
-- Name: comment_reactions comment_reactions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.review_comments(id) ON DELETE CASCADE;


--
-- TOC entry 5143 (class 2606 OID 125572)
-- Name: comment_reactions comment_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_reactions
    ADD CONSTRAINT comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5140 (class 2606 OID 125543)
-- Name: comment_tags comment_tags_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_tags
    ADD CONSTRAINT comment_tags_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.review_comments(id) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 125548)
-- Name: comment_tags comment_tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_tags
    ADD CONSTRAINT comment_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5146 (class 2606 OID 166373)
-- Name: contract_deliverables contract_deliverables_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_deliverables
    ADD CONSTRAINT contract_deliverables_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- TOC entry 5147 (class 2606 OID 166378)
-- Name: contract_deliverables contract_deliverables_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_deliverables
    ADD CONSTRAINT contract_deliverables_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- TOC entry 5129 (class 2606 OID 125401)
-- Name: contract_permissions contract_permissions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions
    ADD CONSTRAINT contract_permissions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 125411)
-- Name: contract_permissions contract_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions
    ADD CONSTRAINT contract_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- TOC entry 5131 (class 2606 OID 125406)
-- Name: contract_permissions contract_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_permissions
    ADD CONSTRAINT contract_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5134 (class 2606 OID 125476)
-- Name: contract_versions contract_versions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 125481)
-- Name: contract_versions contract_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5120 (class 2606 OID 125358)
-- Name: contracts contracts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5121 (class 2606 OID 125621)
-- Name: contracts contracts_director_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_director_decided_by_fkey FOREIGN KEY (director_decided_by) REFERENCES public.users(id);


--
-- TOC entry 5122 (class 2606 OID 125616)
-- Name: contracts contracts_forwarded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_forwarded_by_fkey FOREIGN KEY (forwarded_by) REFERENCES public.users(id);


--
-- TOC entry 5123 (class 2606 OID 166584)
-- Name: contracts contracts_last_edited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_last_edited_by_fkey FOREIGN KEY (last_edited_by) REFERENCES public.users(id);


--
-- TOC entry 5124 (class 2606 OID 125353)
-- Name: contracts contracts_parent_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- TOC entry 5125 (class 2606 OID 166589)
-- Name: contracts contracts_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id);


--
-- TOC entry 5126 (class 2606 OID 125453)
-- Name: contracts fk_parent_contract; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT fk_parent_contract FOREIGN KEY (parent_contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- TOC entry 5148 (class 2606 OID 166546)
-- Name: modules modules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5154 (class 2606 OID 184522)
-- Name: reporting_events reporting_events_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_events
    ADD CONSTRAINT reporting_events_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- TOC entry 5155 (class 2606 OID 184527)
-- Name: reporting_events reporting_events_pgm_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_events
    ADD CONSTRAINT reporting_events_pgm_approved_by_fkey FOREIGN KEY (pgm_approved_by) REFERENCES public.users(id);


--
-- TOC entry 5153 (class 2606 OID 184503)
-- Name: reporting_schedules reporting_schedules_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporting_schedules
    ADD CONSTRAINT reporting_schedules_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- TOC entry 5136 (class 2606 OID 125506)
-- Name: review_comments review_comments_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 125526)
-- Name: review_comments review_comments_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.review_comments(id);


--
-- TOC entry 5138 (class 2606 OID 125516)
-- Name: review_comments review_comments_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- TOC entry 5139 (class 2606 OID 125511)
-- Name: review_comments review_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5149 (class 2606 OID 166571)
-- Name: role_permissions role_permissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5150 (class 2606 OID 166566)
-- Name: role_permissions role_permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- TOC entry 5156 (class 2606 OID 204131)
-- Name: tenant_modules tenant_modules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_modules
    ADD CONSTRAINT tenant_modules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5151 (class 2606 OID 174711)
-- Name: user_notifications user_notifications_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- TOC entry 5152 (class 2606 OID 174706)
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5119 (class 2606 OID 125331)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-02-23 10:45:53

--
-- PostgreSQL database dump complete
--

\unrestrict Vznc3OAW1bIHRocYYxIfov6srnpkUor1HQutgz9vac77GRBUbArtSHmDaVfeKaq

