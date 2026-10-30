import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ChevronRight,
  Code2, Compass, GraduationCap, LayoutDashboard, LogOut, Menu, Plus, Search,
  ShieldCheck, Sparkles, Users, X, Zap, Clock3, MapPin, ExternalLink, Filter,
  UserRound, Github, Linkedin, Globe, Trophy, Send, LockKeyhole
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const demoEvents = [
  { id:'e1', title:'CodeStorm 24-Hour Hackathon', category:'Hackathon', date:'2026-11-08T09:00:00', venue:'Innovation Lab', description:'Build a useful product with a team, learn from mentors and present your prototype.', registration_url:'https://example.com', is_demo:true },
  { id:'e2', title:'Cybersecurity Capture The Flag', category:'Competition', date:'2026-11-12T14:00:00', venue:'Computer Lab 2', description:'Solve practical security challenges in web, crypto and forensics.', registration_url:'', is_demo:true },
  { id:'e3', title:'Design Systems Workshop', category:'Workshop', date:'2026-11-16T11:00:00', venue:'Seminar Hall', description:'Learn UI systems, prototyping and collaborative design workflows.', registration_url:'', is_demo:true }
];
const demoClubs = [
  { id:'c1', name:'Coding & Development Club', category:'Technology', description:'Build projects, practice DSA and collaborate on open-source software.', tags:['Web Dev','DSA','Open Source'], is_demo:true },
  { id:'c2', name:'Cybersecurity Society', category:'Technology', description:'Explore ethical hacking, security labs, CTFs and digital forensics.', tags:['Security','CTF','Networking'], is_demo:true },
  { id:'c3', name:'Robotics & Innovation', category:'Engineering', description:'Prototype smart devices, robotics projects and embedded systems.', tags:['Robotics','IoT','Hardware'], is_demo:true },
  { id:'c4', name:'Creative Design Collective', category:'Creative', description:'Create brand identities, interfaces, motion graphics and campus media.', tags:['UI/UX','Visuals','Motion'], is_demo:true }
];
const navItems = [
  ['Overview', LayoutDashboard], ['Events', CalendarDays], ['Clubs', Users],
  ['Classmates', GraduationCap], ['My Applications', Send]
];

function dateLabel(value) {
  if (!value) return 'Date TBA';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString(undefined, { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
}
function initials(name='Student') { return name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase(); }
function Notice({ notice }) { return notice ? <div className={`notice ${notice.type || 'info'}`}>{notice.text}</div> : null; }

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ name:'', email:'', password:'', invite:'' });
  const [page, setPage] = useState('Overview');
  const [events, setEvents] = useState(demoEvents);
  const [clubs, setClubs] = useState(demoClubs);
  const [applications, setApplications] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [notice, setNotice] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title:'', category:'Hackathon', date:'', venue:'', description:'', registration_url:'' });
  const [showClubForm, setShowClubForm] = useState(false);
  const [clubForm, setClubForm] = useState({ name:'', category:'Technology', description:'', tags:'' });
  const [profileForm, setProfileForm] = useState({ full_name:'', branch:'', year:'', bio:'', skills:'' });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setProfile(null); return; }
    loadCommunity();
  }, [session?.user?.id]);

  async function loadCommunity() {
    if (!supabase || !session?.user) return;
    const [p,e,c,a,m] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
      supabase.from('events').select('*').order('date', { ascending:true }),
      supabase.from('clubs').select('*').order('name'),
      supabase.from('club_applications').select('*, clubs(name)').eq('student_id', session.user.id).order('created_at', {ascending:false}),
      supabase.from('profiles').select('id, full_name, branch, year, skills, bio').order('full_name')
    ]);
    if (p.data) {
      setProfile(p.data);
      setProfileForm({ full_name:p.data.full_name || '', branch:p.data.branch || '', year:p.data.year || '', bio:p.data.bio || '', skills:(p.data.skills || []).join(', ') });
    }
    if (e.data?.length) setEvents(e.data);
    if (c.data?.length) setClubs(c.data);
    if (a.data) setApplications(a.data);
    if (m.data) setMembers(m.data);
  }

  async function handleAuth(e) {
    e.preventDefault(); setAuthLoading(true); setNotice(null);
    try {
      if (!isSupabaseConfigured) throw new Error('First connect Supabase using the setup guide and .env file.');
      if (authMode === 'signup') {
        const configuredInvite = import.meta.env.VITE_CLASS_INVITE_CODE;
        if (!configuredInvite || authForm.invite !== configuredInvite) throw new Error('That class invite code is not valid. Ask your class admin for the current code.');
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email.trim().toLowerCase(), password: authForm.password,
          options: { data: { full_name: authForm.name.trim(), invite_code_used: true } }
        });
        if (error) throw error;
        if (data.session) setNotice({type:'success', text:'Account created! Welcome to O3_incognitos.'});
        else setNotice({type:'success', text:'Check your email to confirm your account, then sign in.'});
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email:authForm.email.trim().toLowerCase(), password:authForm.password });
        if (error) throw error;
      }
    } catch (err) { setNotice({type:'error', text:err.message || 'Something went wrong.'}); }
    finally { setAuthLoading(false); }
  }

  async function signOut() { if (supabase) await supabase.auth.signOut(); setSession(null); setPage('Overview'); }
  async function saveProfile(e) {
    e.preventDefault();
    const values = { id:session.user.id, full_name:profileForm.full_name.trim(), branch:profileForm.branch, year:profileForm.year, bio:profileForm.bio, skills:profileForm.skills.split(',').map(s=>s.trim()).filter(Boolean), updated_at:new Date().toISOString() };
    const { error } = await supabase.from('profiles').upsert(values);
    if (error) setNotice({type:'error', text:error.message});
    else { setProfile(values); setNotice({type:'success', text:'Profile saved.'}); }
  }
  async function applyToClub(club) {
    if (!supabase || !session) return;
    const { error } = await supabase.from('club_applications').insert({ club_id:club.id, student_id:session.user.id, message:'I would like to learn more and contribute to this club.' });
    if (error) setNotice({type:'error', text:error.code === '23505' ? 'You have already applied to this club.' : error.message});
    else { setNotice({type:'success', text:`Application sent to ${club.name}.`}); loadCommunity(); }
  }
  async function registerEvent(event) {
    if (!supabase || !session || event.is_demo) {
      setNotice({type:'info', text:event.is_demo ? 'This is sample content. Connect the database and add real events to enable registration.' : 'Sign in to register.'});
      return;
    }
    const { error } = await supabase.from('event_registrations').insert({ event_id:event.id, student_id:session.user.id });
    setNotice(error ? {type:'error', text:error.code === '23505' ? 'You are already registered.' : error.message} : {type:'success', text:'You are registered for this event.'});
  }
  async function createEvent(e) {
    e.preventDefault();
    const { error } = await supabase.from('events').insert({ ...eventForm, created_by:session.user.id, date:new Date(eventForm.date).toISOString() });
    if (error) setNotice({type:'error', text:error.message});
    else { setNotice({type:'success', text:'Event published.'}); setShowEventForm(false); setEventForm({title:'',category:'Hackathon',date:'',venue:'',description:'',registration_url:''}); loadCommunity(); }
  }
  async function createClub(e) {
    e.preventDefault();
    const { error } = await supabase.from('clubs').insert({ name:clubForm.name, category:clubForm.category, description:clubForm.description, tags:clubForm.tags.split(',').map(s=>s.trim()).filter(Boolean), created_by:session.user.id });
    if (error) setNotice({type:'error', text:error.message});
    else { setNotice({type:'success', text:'Club created.'}); setShowClubForm(false); setClubForm({name:'',category:'Technology',description:'',tags:''}); loadCommunity(); }
  }

  const filteredEvents = useMemo(() => events.filter(e => (category==='All' || e.category===category) && `${e.title} ${e.category} ${e.description}`.toLowerCase().includes(search.toLowerCase())), [events,category,search]);
  const filteredClubs = useMemo(() => clubs.filter(c => `${c.name} ${c.category} ${c.description} ${(c.tags||[]).join(' ')}`.toLowerCase().includes(search.toLowerCase())), [clubs,search]);
  const isAdmin = profile?.role === 'admin';
  const displayName = profile?.full_name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Student';

  if (!session) return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} handleAuth={handleAuth} authLoading={authLoading} notice={notice} configured={isSupabaseConfigured} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}>
      <div className="brand"><div className="brand-mark"><Zap size={23} fill="currentColor"/></div><div><strong>O3_<span>incognitos</span></strong><small>STUDENT NETWORK</small></div><button className="icon-button mobile-close" onClick={()=>setMobileNav(false)}><X/></button></div>
      <div className="workspace"><div className="workspace-icon"><GraduationCap size={17}/></div><div><b>Class Community</b><small>Private workspace</small></div><span className="online-dot"/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{navItems.map(([label,Icon])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{setPage(label);setMobileNav(false);setNotice(null);}}><Icon size={18}/><span>{label}</span>{label==='Events'&&<span className="nav-count">{events.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-card"><ShieldCheck size={18}/><b>Private by design</b><p>Class members only. Keep personal information safe.</p></div><button className="nav-item" onClick={()=>setPage('Profile')}><UserRound size={18}/>My profile</button><button className="nav-item" onClick={signOut}><LogOut size={18}/>Sign out</button></div>
    </aside>
    {mobileNav&&<div className="scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="icon-button menu-button" onClick={()=>setMobileNav(true)}><Menu/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/><b>{page}</b></div><div className="top-actions"><div className="searchbox"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events, clubs..." /></div><button className="icon-button notification-button" title="Notifications"><Bell size={18}/><i/></button><button className="user-pill" onClick={()=>setPage('Profile')}><div className="avatar">{initials(displayName)}</div><span>{displayName}</span><ChevronRight size={14}/></button></div></header>
      <div className="content"><Notice notice={notice}/>{page==='Overview'&&<Overview displayName={displayName} events={events} clubs={clubs} members={members} setPage={setPage} setSearch={setSearch} applications={applications} />}
      {page==='Events'&&<EventsPage events={filteredEvents} category={category} setCategory={setCategory} registerEvent={registerEvent} isAdmin={isAdmin} setShowEventForm={setShowEventForm}/>}
      {page==='Clubs'&&<ClubsPage clubs={filteredClubs} applications={applications} applyToClub={applyToClub} isAdmin={isAdmin} setShowClubForm={setShowClubForm}/>}
      {page==='Classmates'&&<ClassmatesPage members={members} />}
      {page==='My Applications'&&<ApplicationsPage applications={applications}/>}
      {page==='Profile'&&<ProfilePage profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile} profile={profile} />}
      {showEventForm&&<Modal title="Publish a new event" close={()=>setShowEventForm(false)}><form className="form-stack" onSubmit={createEvent}><Field label="Event title"><input required value={eventForm.title} onChange={e=>setEventForm({...eventForm,title:e.target.value})}/></Field><div className="form-grid"><Field label="Category"><select value={eventForm.category} onChange={e=>setEventForm({...eventForm,category:e.target.value})}><option>Hackathon</option><option>Workshop</option><option>Competition</option><option>Fest</option><option>Talk</option></select></Field><Field label="Date & time"><input required type="datetime-local" value={eventForm.date} onChange={e=>setEventForm({...eventForm,date:e.target.value})}/></Field></div><Field label="Venue"><input required value={eventForm.venue} onChange={e=>setEventForm({...eventForm,venue:e.target.value})}/></Field><Field label="Description"><textarea required rows="3" value={eventForm.description} onChange={e=>setEventForm({...eventForm,description:e.target.value})}/></Field><Field label="Registration link (optional)"><input type="url" value={eventForm.registration_url} onChange={e=>setEventForm({...eventForm,registration_url:e.target.value})}/></Field><button className="btn-primary" type="submit">Publish event <ArrowRight size={16}/></button></form></Modal>}
      {showClubForm&&<Modal title="Create a club" close={()=>setShowClubForm(false)}><form className="form-stack" onSubmit={createClub}><Field label="Club name"><input required value={clubForm.name} onChange={e=>setClubForm({...clubForm,name:e.target.value})}/></Field><Field label="Category"><select value={clubForm.category} onChange={e=>setClubForm({...clubForm,category:e.target.value})}><option>Technology</option><option>Engineering</option><option>Creative</option><option>Business</option><option>Social Impact</option></select></Field><Field label="Description"><textarea required rows="3" value={clubForm.description} onChange={e=>setClubForm({...clubForm,description:e.target.value})}/></Field><Field label="Tags (comma-separated)"><input value={clubForm.tags} onChange={e=>setClubForm({...clubForm,tags:e.target.value})} placeholder="Web Dev, Design, AI"/></Field><button className="btn-primary" type="submit">Create club <ArrowRight size={16}/></button></form></Modal>}
      </div>
    </main>
  </div>;
}

function AuthScreen({authMode,setAuthMode,authForm,setAuthForm,handleAuth,authLoading,notice,configured}) {
  return <div className="auth-layout"><div className="auth-left"><div className="auth-brand"><div className="brand-mark"><Zap size={24} fill="currentColor"/></div><div><strong>O3_<span>incognitos</span></strong><small>STUDENT NETWORK</small></div></div><div className="auth-hero"><div className="eyebrow"><span className="pulse"/> YOUR CLASS, CONNECTED</div><h1>Find your people.<br/><span>Build your future.</span></h1><p>One private space for your classmates to discover hackathons, join clubs, share skills and create something extraordinary.</p><div className="hero-metrics"><div><b>01</b><span>Connect</span></div><div><b>02</b><span>Discover</span></div><div><b>03</b><span>Build</span></div></div><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-glow"/></div><div className="auth-foot"><ShieldCheck size={15}/> A focused, class-only community</div></div><div className="auth-right"><div className="auth-card"><div className="auth-card-icon"><LockKeyhole size={22}/></div><div className="eyebrow">WELCOME TO O3</div><h2>{authMode==='signin'?'Welcome back':'Join the community'}</h2><p className="muted">{authMode==='signin'?'Sign in to continue to your student workspace.':'Create your account using your class invite code.'}</p><Notice notice={notice}/>{!configured&&<div className="notice warning">Setup needed: create a Supabase project and fill in your .env file. See README.md.</div>}<form className="form-stack" onSubmit={handleAuth}>{authMode==='signup'&&<Field label="Full name"><input required autoComplete="name" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></Field>}<Field label="College email"><input required type="email" autoComplete="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@college.edu"/></Field><Field label="Password"><input required type="password" minLength="8" autoComplete={authMode==='signin'?'current-password':'new-password'} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="At least 8 characters"/></Field>{authMode==='signup'&&<Field label="Class invite code"><input required value={authForm.invite} onChange={e=>setAuthForm({...authForm,invite:e.target.value})} placeholder="Ask your class admin"/></Field>}<button disabled={authLoading} className="btn-primary auth-submit" type="submit">{authLoading?'Please wait…':authMode==='signin'?'Sign in to workspace':'Create account'} <ArrowRight size={17}/></button></form><div className="auth-switch">{authMode==='signin'?"New to O3_incognitos?":"Already have an account?"}<button onClick={()=>{setAuthMode(authMode==='signin'?'signup':'signin');}}> {authMode==='signin'?'Create account':'Sign in'}</button></div><div className="auth-secure"><ShieldCheck size={14}/> Your account is protected by Supabase Auth</div></div></div></div>;
}
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function PageHeading({eyebrow,title,description,action}) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function Overview({displayName,events,clubs,members,setPage,setSearch,applications}) {
  const upcoming=events.filter(e=>!e.date||new Date(e.date)>=new Date()).slice(0,3);
  return <><div className="welcome-banner"><div className="welcome-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR CAMPUS, UNLOCKED</div><h1>Good to have you here, <span>{displayName.split(' ')[0]}.</span></h1><p>Your next idea, teammate or opportunity is just around the corner.</p><button className="btn-primary" onClick={()=>setPage('Events')}>Explore opportunities <ArrowRight size={16}/></button></div><div className="welcome-art"><div className="art-ring ring-a"/><div className="art-ring ring-b"/><div className="art-core"><Zap size={40} fill="currentColor"/></div><span className="float-chip chip-a"><Code2 size={15}/> Build</span><span className="float-chip chip-b"><Users size={15}/> Connect</span><span className="float-chip chip-c"><Trophy size={15}/> Win</span></div></div><div className="stats-grid"><Stat icon={Users} label="Classmates" value={members.length||'—'} note="In your network" tone="violet"/><Stat icon={CalendarDays} label="Upcoming events" value={upcoming.length||'0'} note="Opportunities ahead" tone="blue"/><Stat icon={BlocksIcon} label="Clubs to explore" value={clubs.length} note="Find your community" tone="pink"/><Stat icon={Activity} label="Your applications" value={applications.length} note="Track your progress" tone="green"/></div><div className="section-heading"><div><h2>Coming up next</h2><p>Events worth adding to your calendar.</p></div><button className="text-link" onClick={()=>setPage('Events')}>All events <ArrowRight size={15}/></button></div><div className="event-list">{upcoming.map(e=><EventRow key={e.id} event={e} onClick={()=>setPage('Events')}/>)}</div><div className="section-heading section-heading-spaced"><div><h2>Find your people</h2><p>Communities built around what you love.</p></div><button className="text-link" onClick={()=>setPage('Clubs')}>Explore clubs <ArrowRight size={15}/></button></div><div className="club-grid">{clubs.slice(0,3).map((c,i)=><ClubCard key={c.id} club={c} index={i} compact onApply={()=>setPage('Clubs')}/>)}</div></>;
}
function BlocksIcon(props) { return <BookOpen {...props}/>; }
function Stat({icon:Icon,label,value,note,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function EventsPage({events,category,setCategory,registerEvent,isAdmin,setShowEventForm}) {
  return <><PageHeading eyebrow="DISCOVER & PARTICIPATE" title="Events & opportunities" description="Find your next hackathon, workshop, competition or campus experience." action={isAdmin&&<button className="btn-primary" onClick={()=>setShowEventForm(true)}><Plus size={16}/> Add event</button>}/><div className="filter-row"><div className="filter-label"><Filter size={16}/> Filter by</div>{['All','Hackathon','Workshop','Competition','Fest','Talk'].map(c=><button key={c} className={`filter-chip ${category===c?'selected':''}`} onClick={()=>setCategory(c)}>{c}</button>)}</div>{events.length?<div className="event-grid">{events.map((e,i)=><EventCard key={e.id} event={e} index={i} onRegister={()=>registerEvent(e)}/>)}</div>:<EmptyState title="No events found" text="Try another search or category filter."/>}</>;
}
function EventCard({event,index,onRegister}) {
  const colors=['violet','blue','pink','green']; const tone=colors[index%colors.length];
  return <article className="event-card"><div className={`event-cover ${tone}`}><div className="cover-pattern"><span/><span/><span/></div><span className="event-type">{event.category||'Event'}</span><div className="cover-icon">{event.category==='Hackathon'?<Code2/>:event.category==='Workshop'?<BookOpen/>:<Zap/>}</div><div className="event-date-badge"><b>{event.date?new Date(event.date).getDate():'TBA'}</b><span>{event.date?new Date(event.date).toLocaleString(undefined,{month:'short'}):'DATE'}</span></div></div><div className="event-card-body"><h3>{event.title}</h3><p>{event.description}</p><div className="event-meta"><span><Clock3 size={14}/>{dateLabel(event.date)}</span><span><MapPin size={14}/>{event.venue||'Venue TBA'}</span></div><div className="card-footer"><span className="status-dot"><i/> Registration open</span><button className="btn-small" onClick={onRegister}>Register <ArrowRight size={14}/></button></div>{event.registration_url&&<a className="external-link" href={event.registration_url} target="_blank" rel="noreferrer">External registration <ExternalLink size={12}/></a>}</div></article>;
}
function EventRow({event,onClick}) { return <button className="event-row" onClick={onClick}><div className="row-date"><b>{event.date?new Date(event.date).getDate():'—'}</b><span>{event.date?new Date(event.date).toLocaleString(undefined,{month:'short'}):'TBA'}</span></div><div className="row-event-info"><h3>{event.title}</h3><p><span>{event.category}</span><i/> <MapPin size={13}/>{event.venue||'Venue TBA'}</p></div><div className="row-event-time"><Clock3 size={14}/>{dateLabel(event.date)}</div><ChevronRight className="row-chevron" size={18}/></button>; }
function ClubsPage({clubs,applications,applyToClub,isAdmin,setShowClubForm}) {
  const applied = new Set(applications.map(a=>a.club_id));
  return <><PageHeading eyebrow="COMMUNITIES & INTERESTS" title="Explore college clubs" description="Find a team that matches your interests, learn new skills and contribute to real projects." action={isAdmin&&<button className="btn-primary" onClick={()=>setShowClubForm(true)}><Plus size={16}/> Add club</button>}/><div className="club-grid club-grid-full">{clubs.map((c,i)=><ClubCard key={c.id} club={c} index={i} applied={applied.has(c.id)} onApply={()=>applyToClub(c)}/>)}</div>{!clubs.length&&<EmptyState title="No clubs found" text="Try a different search."/>}</>;
}
function ClubCard({club,index,applied,onApply,compact=false}) {
  const tones=['violet','blue','pink','green']; const icons=[Code2,ShieldCheck,Zap,Sparkles]; const Icon=icons[index%icons.length];
  return <article className={`club-card ${compact?'compact':''}`}><div className={`club-art ${tones[index%tones.length]}`}><div className="club-art-grid"/><div className="club-emblem"><Icon size={27}/></div><span className="club-category">{club.category||'Community'}</span></div><div className="club-card-body"><h3>{club.name}</h3><p>{club.description}</p><div className="tag-list">{(club.tags||[]).slice(0,4).map(t=><span key={t}>{t}</span>)}</div><div className="club-card-footer"><div className="club-members"><Users size={14}/><span>Student community</span></div><button className={`btn-small ${applied?'applied':''}`} disabled={applied} onClick={onApply}>{applied?<><CheckCircle2 size={14}/> Applied</>:<>Apply to join <ArrowRight size={14}/></>}</button></div></div></article>;
}
function ClassmatesPage({members}) {
  return <><PageHeading eyebrow="YOUR NETWORK" title="Meet your classmates" description="Discover people to learn with, collaborate with and build projects alongside."/><div className="classmate-grid">{members.map(m=><article className="classmate-card" key={m.id}><div className="classmate-top"><div className="avatar avatar-large">{initials(m.full_name||'Student')}</div><span className="member-status"><i/> Member</span></div><h3>{m.full_name||'Student'}</h3><p>{[m.branch,m.year].filter(Boolean).join(' · ')||'Student member'}</p><div className="classmate-bio">{m.bio||'Ready to connect and collaborate with the community.'}</div><div className="tag-list">{(m.skills||[]).slice(0,3).map(s=><span key={s}>{s}</span>)}</div></article>)}</div>{!members.length&&<EmptyState title="Your network starts here" text="Classmates who complete their profiles will appear here."/>}</>;
}
function ApplicationsPage({applications}) {
  return <><PageHeading eyebrow="YOUR ACTIVITY" title="My applications" description="Keep track of the clubs you've applied to and your next steps."/><div className="applications-panel">{applications.length?applications.map(a=><div className="application-row" key={a.id}><div className="application-icon"><Users size={19}/></div><div className="application-info"><h3>{a.clubs?.name||'Club application'}</h3><p>Submitted {dateLabel(a.created_at)}</p></div><span className={`application-status ${(a.status||'pending').toLowerCase()}`}>{a.status||'Pending'}</span></div>):<EmptyState title="No applications yet" text="Explore clubs and apply to the ones that interest you."/>}</div></>;
}
function ProfilePage({profileForm,setProfileForm,saveProfile,profile}) {
  return <><PageHeading eyebrow="YOUR IDENTITY" title="Your student profile" description="Help classmates find your skills and discover what you want to build."/><div className="profile-layout"><div className="profile-summary"><div className="avatar avatar-xl">{initials(profileForm.full_name||'Student')}</div><h2>{profileForm.full_name||'Your name'}</h2><p>{[profileForm.branch,profileForm.year].filter(Boolean).join(' · ')||'Add your academic details'}</p><span className="profile-member"><ShieldCheck size={14}/> Class member</span><div className="profile-summary-note">Share only the information you are comfortable showing to classmates.</div></div><form className="profile-form panel" onSubmit={saveProfile}><h3>Profile details</h3><p className="muted">Build your student identity.</p><Field label="Full name"><input required value={profileForm.full_name} onChange={e=>setProfileForm({...profileForm,full_name:e.target.value})}/></Field><div className="form-grid"><Field label="Branch / department"><input value={profileForm.branch} onChange={e=>setProfileForm({...profileForm,branch:e.target.value})} placeholder="e.g. Computer Science"/></Field><Field label="Year of study"><select value={profileForm.year} onChange={e=>setProfileForm({...profileForm,year:e.target.value})}><option value="">Select year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>Other</option></select></Field></div><Field label="Short bio"><textarea rows="3" value={profileForm.bio} onChange={e=>setProfileForm({...profileForm,bio:e.target.value})} placeholder="What are you interested in building or learning?"/></Field><Field label="Skills (comma-separated)"><input value={profileForm.skills} onChange={e=>setProfileForm({...profileForm,skills:e.target.value})} placeholder="React, Python, UI/UX, AI"/></Field><div className="profile-private-note"><ShieldCheck size={16}/> Only approved class members can view the class directory.</div><button className="btn-primary" type="submit">Save profile <CheckCircle2 size={16}/></button></form></div></>;
}
function EmptyState({title,text}) { return <div className="empty-state"><div><Compass size={25}/></div><h3>{title}</h3><p>{text}</p></div>; }
function Modal({title,close,children}) { return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={close}><X/></button></div>{children}</div></div>; }