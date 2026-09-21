import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, Linking, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as api from './src/api';
import { C, F, SALON } from './src/theme';
import { Blob, Button, CountUp, Eyebrow, Glass, H2, P, Reveal, useWide } from './src/ui';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href =
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=DM+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(l);
  document.title = `${SALON.name} | Hair, nails and skin in ${SALON.city}`;
}

const money = (n) => `KES ${Number(n).toLocaleString('en-KE')}`;
const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);

const PAGES = ['home', 'services', 'book'];
const pageFromHash = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'home';
  const p = window.location.hash.replace(/^#\/?/, '');
  return PAGES.includes(p) ? p : 'home';
};

export default function App() {
  const wide = useWide();
  const scroll = useRef(null);
  const [page, setPage] = useState(pageFromHash);
  const [info, setInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [serviceId, setServiceId] = useState(null);

  useEffect(() => {
    Promise.all([api.getInfo(), api.getServices(), api.getReviews()])
      .then(([i, s, r]) => {
        setInfo(i);
        setServices(s);
        setReviews(r);
        if (s[0]) setServiceId(s[0].id);
      })
      .catch(() => setLoadError(true));
  }, []);

  // Keep the address bar and the back button in step with the page (web only).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onHash = () => { setPage(pageFromHash()); scroll.current?.scrollTo({ y: 0, animated: false }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = `${page === 'home' ? '' : page[0].toUpperCase() + page.slice(1) + ' | '}${SALON.name}`;
  }, [page]);

  const go = useCallback((p) => {
    const next = PAGES.includes(p) ? p : 'home';
    setPage(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS === 'web') window.location.hash = next === 'home' ? '' : `/${next}`;
  }, []);
  const pick = (id) => { setServiceId(id); go('book'); };
  const whatsapp = info?.whatsapp || '254700000000';

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <StatusBar style="dark" />
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false}>
        {page === 'home' && (
          <View key="home">
            <Hero wide={wide} info={info} services={services} go={go} />
            <Services wide={wide} services={services} error={loadError} onPick={pick} go={go} preview />
            <Gallery wide={wide} />
            <Reviews wide={wide} reviews={reviews} />
            <CallToAction go={go} />
          </View>
        )}
        {page === 'services' && (
          <View key="services" style={{ paddingTop: wide ? 70 : 120 }}>
            <Services wide={wide} services={services} error={loadError} onPick={pick} go={go} />
            <CallToAction go={go} />
          </View>
        )}
        {page === 'book' && (
          <View key="book" style={{ paddingTop: wide ? 70 : 120, backgroundColor: C.cream }}>
            <Booking wide={wide} services={services} serviceId={serviceId} setServiceId={setServiceId} />
            <VisitInfo wide={wide} />
          </View>
        )}
        <Footer wide={wide} go={go} />
      </ScrollView>

      <NavBar wide={wide} page={page} go={go} />
      <WhatsAppButton number={whatsapp} />
    </View>
  );
}

/* ---------- Navigation ---------- */

function NavBar({ wide, page, go }) {
  const links = [['Home', 'home'], ['Services', 'services']];
  return (
    <View style={s.navWrap} pointerEvents="box-none">
      <Glass strong radius={999} style={s.nav}>
        <Pressable accessibilityRole="link" accessibilityLabel="Petals and Glam home" onPress={() => go('home')}>
          <Text style={s.logo}>Petals <Text style={{ color: C.rose, fontStyle: 'italic' }}>&</Text> Glam</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: wide ? 30 : 0 }}>
          {wide && links.map(([l, k]) => <NavLink key={k} label={l} active={page === k} onPress={() => go(k)} />)}
          <Button label="Book now" onPress={() => go('book')} style={{ marginLeft: wide ? 6 : 0 }} />
        </View>
      </Glass>
      {!wide && (
        <Glass strong radius={999} style={{ marginTop: 8, flexDirection: 'row', padding: 4 }}>
          {[...links, ['Book', 'book']].map(([l, k]) => (
            <Pressable key={k} accessibilityRole="link" accessibilityState={{ selected: page === k }} onPress={() => go(k)}
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 22, borderRadius: 999, backgroundColor: page === k ? C.ink : 'transparent' }}>
              <Text style={{ fontFamily: F.sans, fontSize: 14, color: page === k ? C.paper : C.heading }}>{l}</Text>
            </Pressable>
          ))}
        </Glass>
      )}
    </View>
  );
}

function NavLink({ label, active, onPress }) {
  const [h, setH] = useState(false);
  return (
    <Pressable accessibilityRole="link" accessibilityState={{ selected: active }} onPress={onPress}
      onHoverIn={() => setH(true)} onHoverOut={() => setH(false)}
      style={{ paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: active ? C.gold : 'transparent' }}>
      <Text style={{ fontFamily: F.sans, fontSize: 14, color: h || active ? C.roseText : C.heading, ...(Platform.OS === 'web' ? { transitionDuration: '200ms' } : null) }}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- Hero ---------- */

function Hero({ wide, info, services, go }) {
  const [next, setNext] = useState(null);
  const sv = services[0];

  useEffect(() => {
    if (!sv) return;
    (async () => {
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        try {
          const { slots } = await api.getSlots(sv.id, api.iso(d));
          if (slots.length) return setNext({ day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-KE', { weekday: 'long' }), time: api.to12h(slots[0]) });
        } catch { return; }
      }
    })();
  }, [sv?.id]);

  return (
    <View style={[s.hero, wide && { flexDirection: 'row', minHeight: 720 }]}>
      <View style={[s.heroLeft, wide && { flex: 1.05, paddingLeft: 72, paddingRight: 40 }]}>
        <Reveal from={16}><Eyebrow>{SALON.city} beauty salon</Eyebrow></Reveal>
        <Reveal delay={120}>
          <Text style={[s.heroTitle, !wide && { fontSize: 58, lineHeight: 60 }]}>
            Feel like{'\n'}yourself, <Text style={{ color: C.rose, fontStyle: 'italic' }}>only{'\n'}more so.</Text>
          </Text>
        </Reveal>
        <Reveal delay={260}>
          <P style={{ maxWidth: 470, marginTop: 22, fontSize: 17 }}>
            Hair, nails, skin and lashes done by people who take their time. Pick a service, choose a slot that
            actually exists, and we will have the kettle on.
          </P>
        </Reveal>
        <Reveal delay={400} style={{ flexDirection: 'row', gap: 12, marginTop: 34, flexWrap: 'wrap' }}>
          <Button label="Book an appointment" onPress={() => go('book')} />
          <Button label="See services" variant="ghost" onPress={() => go('services')} />
        </Reveal>

        <Reveal delay={540} style={{ flexDirection: 'row', gap: 40, marginTop: 52, flexWrap: 'wrap' }}>
          <Stat n={info?.stats.reviews} label="Client reviews" />
          <Stat n={info?.stats.clients} label="Clients booked" />
          <Stat text={info ? `${((info.open_hour + 11) % 12) + 1} to ${((info.close_hour + 11) % 12) + 1}` : ''} label="Open daily" />
        </Reveal>
      </View>

      <View style={[s.heroRight, wide && { flex: 1 }]}>
        <Blob color={C.goldSoft} size={340} style={{ top: 30, left: -40 }} dx={40} dy={30} />
        <Blob color={C.rose} size={230} style={{ bottom: 40, right: 20, opacity: 0.85 }} dx={-34} dy={-30} duration={11000} />
        <Blob color={C.gold} size={140} style={{ top: 120, right: 90 }} dx={22} dy={40} duration={7500} />

        <Reveal delay={300} style={{ width: '100%', maxWidth: 380 }}>
          <Glass style={{ padding: 26 }}>
            <Eyebrow>Next free chair</Eyebrow>
            <Text style={s.glassBig}>{next ? `${next.day}, ${next.time}` : 'Checking the diary'}</Text>
            <P style={{ fontSize: 14, marginTop: 6 }}>
              {sv ? `For a ${sv.name.toLowerCase()}. Other services may have different gaps.` : 'One moment.'}
            </P>
            <View style={s.rule} />
            <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.body }}>{SALON.address}</Text>
          </Glass>
          <Glass style={{ padding: 20, marginTop: 16, marginLeft: wide ? 50 : 24 }}>
            <Text style={{ fontFamily: F.serif, fontSize: 21, color: C.heading, fontStyle: 'italic', lineHeight: 27 }}>
              "Booked at lunch, walked in that evening. Nobody made me wait."
            </Text>
            <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 8 }}>Wanjiru K.</Text>
          </Glass>
        </Reveal>
      </View>
    </View>
  );
}

function Stat({ n, text, label }) {
  return (
    <View>
      {text !== undefined ? (
        <Text style={s.statNum}>{text}</Text>
      ) : n != null ? (
        <CountUp to={n} style={s.statNum} />
      ) : (
        <Text style={s.statNum}>-</Text>
      )}
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------- Services ---------- */

function Services({ wide, services, error, onPick, go, preview }) {
  const cats = useMemo(() => ['All', ...new Set(services.map((x) => x.category))], [services]);
  const [cat, setCat] = useState('All');
  const shown = preview ? services.slice(0, 3) : services.filter((x) => cat === 'All' || x.category === cat);

  return (
    <View style={s.section}>
      <Reveal><Eyebrow>What we do</Eyebrow></Reveal>
      <Reveal delay={80}><H2 style={{ marginTop: 10 }}>{preview ? 'Most booked' : 'Services and prices'}</H2></Reveal>
      <Reveal delay={140}><P style={{ marginTop: 10, maxWidth: 520 }}>The price you see is the price you pay. Times are how long to set aside.</P></Reveal>

      {!preview && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
        {cats.map((c) => (
          <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: cat === c }} onPress={() => setCat(c)} style={[s.chip, cat === c && { backgroundColor: C.ink, borderColor: C.ink }]}>
            <Text style={{ fontFamily: F.sans, fontSize: 13, color: cat === c ? C.paper : C.heading }}>{c}</Text>
          </Pressable>
        ))}
      </View>}

      {error ? (
        <P style={{ marginTop: 30, color: C.roseText }}>We could not load the menu just now. Check your connection and refresh, or message us on WhatsApp.</P>
      ) : !services.length ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
      ) : (
        <View style={[s.grid, { marginTop: 26 }]}>
          {shown.map((sv, i) => (
            <Reveal key={sv.id} delay={(i % 3) * 90} style={{ width: wide ? '32%' : '100%', flexGrow: 1 }}>
              <ServiceCard sv={sv} onPick={() => onPick(sv.id)} />
            </Reveal>
          ))}
        </View>
      )}
      {preview && !!services.length && (
        <Button label="See every service" variant="ghost" onPress={() => go('services')} style={{ marginTop: 28, alignSelf: 'flex-start' }} />
      )}
    </View>
  );
}

function ServiceCard({ sv, onPick }) {
  const y = useRef(new Animated.Value(0)).current;
  const lift = (to) => Animated.timing(y, { toValue: to, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  return (
    <Animated.View style={{ transform: [{ translateY: y }] }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Book ${sv.name}, ${money(sv.price)}`} onPress={onPick} onHoverIn={() => lift(-6)} onHoverOut={() => lift(0)} style={s.card}>
        <Text style={s.cardCat}>{sv.category}</Text>
        <Text style={s.cardName}>{sv.name}</Text>
        <P style={{ fontSize: 14, lineHeight: 22, marginTop: 6, minHeight: 44 }}>{sv.description}</P>
        <View style={s.cardFoot}>
          <Text style={s.price}>{money(sv.price)}</Text>
          <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.muted }}>{mins(sv.duration_minutes)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ---------- Booking ---------- */

function Booking({ wide, services, serviceId, setServiceId }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const [day, setDay] = useState(days[0]);
  const [slots, setSlots] = useState(null);
  const [slot, setSlot] = useState(null);
  const [f, setF] = useState({ name: '', phone: '', email: '', notes: '' });
  const [deposit, setDeposit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const sv = services.find((x) => x.id === serviceId);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const loadSlots = useCallback(() => {
    if (!serviceId) return;
    setSlots(null);
    setSlot(null);
    api.getSlots(serviceId, api.iso(day)).then((r) => setSlots(r.slots)).catch(() => setSlots([]));
  }, [serviceId, day]);
  useEffect(loadSlots, [loadSlots]);

  const submit = async () => {
    setError('');
    if (!sv) return setError('Choose a service first.');
    if (!slot) return setError('Pick a time that suits you.');
    if (f.name.trim().length < 2) return setError('Please tell us your name.');
    if (!f.phone.trim()) return setError('We need your phone number to confirm.');
    setBusy(true);
    try {
      const b = await api.book({
        service: sv.id, customer_name: f.name.trim(), phone: f.phone, email: f.email, notes: f.notes,
        date: api.iso(day), start_time: slot, pay_now: deposit,
      });
      setDone(b);
    } catch (e) {
      setError(e.message);
      loadSlots();
    } finally {
      setBusy(false);
    }
  };

  const dep = sv ? Math.round(sv.price * 0.2) : 0;

  return (
    <View style={[s.section, { backgroundColor: C.cream, paddingBottom: 40 }]}>
      <Blob color={C.goldSoft} size={300} style={{ top: -80, right: -60 }} dx={-30} dy={30} duration={10000} />
      <Reveal><Eyebrow>Book</Eyebrow></Reveal>
      <Reveal delay={80}><H2 style={{ marginTop: 10 }}>Pick your time</H2></Reveal>

      <Reveal delay={140} style={{ marginTop: 28 }}>
        <Glass strong radius={28} style={{ padding: wide ? 40 : 20 }}>
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 48 : 28 }}>
            <View style={{ flex: 1 }}>
              <Label>1. Service</Label>
              <View style={{ gap: 8 }}>
                {services.map((x) => (
                  <Pressable key={x.id} accessibilityRole="radio" accessibilityState={{ selected: x.id === serviceId }} onPress={() => setServiceId(x.id)}
                    style={[s.option, x.id === serviceId && { borderColor: C.ink, backgroundColor: C.paper }]}>
                    <Text style={{ fontFamily: F.sans, fontSize: 14.5, color: C.heading, flex: 1 }}>{x.name}</Text>
                    <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.body }}>{money(x.price)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flex: 1.2 }}>
              <Label>2. Day</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {days.map((d) => {
                  const on = api.iso(d) === api.iso(day);
                  return (
                    <Pressable key={d.toDateString()} accessibilityRole="button" accessibilityLabel={d.toDateString()} accessibilityState={{ selected: on }} onPress={() => setDay(d)} style={[s.dayBox, on && { backgroundColor: C.ink, borderColor: C.ink }]}>
                      <Text style={[s.dayTop, on && { color: C.goldSoft }]}>{d.toLocaleDateString('en-KE', { weekday: 'short' })}</Text>
                      <Text style={[s.dayNum, on && { color: C.paper }]}>{d.getDate()}</Text>
                      <Text style={[s.dayTop, on && { color: C.goldSoft }]}>{d.toLocaleDateString('en-KE', { month: 'short' })}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Label style={{ marginTop: 22 }}>3. Time</Label>
              {slots === null ? (
                <ActivityIndicator color={C.gold} style={{ alignSelf: 'flex-start' }} />
              ) : slots.length === 0 ? (
                <P style={{ fontSize: 14 }}>Nothing left that day for this service. Try another day, or message us and we will see what we can do.</P>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {slots.map((t) => (
                    <Pressable key={t} accessibilityRole="button" accessibilityLabel={`${api.to12h(t)}`} accessibilityState={{ selected: slot === t }} onPress={() => setSlot(t)} style={[s.slot, slot === t && { backgroundColor: C.ink, borderColor: C.ink }]}>
                      <Text style={{ fontFamily: F.sans, fontSize: 13.5, color: slot === t ? C.paper : C.heading }}>{api.to12h(t)}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Label style={{ marginTop: 22 }}>4. Your details</Label>
              <Field placeholder="Full name" value={f.name} onChangeText={set('name')} />
              <Field placeholder="Phone, e.g. 0712 345 678" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
              <Field placeholder="Email (optional)" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
              <Field placeholder="Anything we should know? (optional)" value={f.notes} onChangeText={set('notes')} />

              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: deposit }} onPress={() => setDeposit((v) => !v)} style={s.depositRow}>
                <View style={[s.check, deposit && { backgroundColor: C.ink }]}>
                  {deposit && <View style={s.checkDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.sans, fontSize: 14, color: C.heading }}>Secure it with an M-Pesa deposit{sv ? ` of ${money(dep)}` : ''}</Text>
                  <Text style={{ fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: 2 }}>20% now, the rest at the salon. A prompt goes to your phone.</Text>
                </View>
              </Pressable>

              {!!error && <Text style={{ fontFamily: F.sans, color: C.roseText, marginTop: 14, fontSize: 14 }} accessibilityRole="alert">{error}</Text>}
              <Button label={busy ? 'Booking...' : 'Confirm booking'} onPress={submit} disabled={busy} style={{ marginTop: 18 }} />
            </View>
          </View>
        </Glass>
      </Reveal>

      <Confirmation done={done} sv={sv} day={day} slot={slot} onClose={() => { setDone(null); setF({ name: '', phone: '', email: '', notes: '' }); loadSlots(); }} />
    </View>
  );
}

function Confirmation({ done, sv, day, slot, onClose }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (done) Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
    else v.setValue(0);
  }, [done]);
  if (!done) return null;
  const paid = done.payment_status === 'paid';
  const sent = done.payment_status === 'pending';
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={s.overlay}>
        <Animated.View style={{ width: '100%', maxWidth: 440, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
          <Glass strong radius={28} style={{ padding: 32 }}>
            <Eyebrow>You are booked</Eyebrow>
            <Text style={{ fontFamily: F.serif, fontSize: 34, color: C.heading, marginTop: 8, lineHeight: 38 }}>See you soon, {done.customer_name.split(' ')[0]}.</Text>
            <View style={s.rule} />
            <Row k="Service" v={sv?.name} />
            <Row k="Date" v={day.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })} />
            <Row k="Time" v={slot && api.to12h(slot)} />
            <Row k="Total" v={sv && money(sv.price)} />
            {done.deposit_amount > 0 && (
              <Row k="Deposit" v={paid ? `${money(done.deposit_amount)} received` : sent ? `${money(done.deposit_amount)}, check your phone` : 'M-Pesa did not go through, pay at the salon'} />
            )}
            <P style={{ fontSize: 13.5, marginTop: 16 }}>Need to change something? Message us on WhatsApp and we will move you.</P>
            <Button label="Done" onPress={onClose} style={{ marginTop: 20 }} />
          </Glass>
        </Animated.View>
      </View>
    </Modal>
  );
}

const Row = ({ k, v }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 16 }}>
    <Text style={{ fontFamily: F.sans, fontSize: 14, color: C.muted }}>{k}</Text>
    <Text style={{ fontFamily: F.sans, fontSize: 14, color: C.heading, flexShrink: 1, textAlign: 'right' }}>{v}</Text>
  </View>
);

const Label = ({ children, style }) => (
  <Text style={[{ fontFamily: F.sans, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: C.body, fontWeight: '600', marginBottom: 12 }, style]}>{children}</Text>
);

function Field(props) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor={C.muted}
      accessibilityLabel={props.placeholder}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      {...props}
      style={[s.input, focus && { borderColor: C.gold }, Platform.OS === 'web' && { outlineStyle: 'none', transitionDuration: '200ms' }]}
    />
  );
}

/* ---------- Gallery ---------- */

// Stand-in photos (Unsplash). Replace these files in assets/gallery with the salon's own work.
const TILES = [
  ['Hair', 'Soft waves, freshly finished', require('./assets/gallery/hair.jpg'), 420],
  ['Nails', 'Gel colour with a glossy finish', require('./assets/gallery/nails.jpg'), 420],
  ['Skin', 'Signature facial with a clay mask', require('./assets/gallery/facial.jpg'), 420],
  ['Makeup', 'Bridal and event looks', require('./assets/gallery/makeup.jpg'), 420],
  ['Pedicure', 'Warm soak with fresh flowers', require('./assets/gallery/pedicure.jpg'), 420],
  ['The salon', 'Where you will be sitting', require('./assets/gallery/salon.jpg'), 420],
];

function Gallery({ wide }) {
  return (
    <View style={s.section}>
      <Reveal><Eyebrow>Our work</Eyebrow></Reveal>
      <Reveal delay={80}><H2 style={{ marginTop: 10 }}>A look at the chair</H2></Reveal>
      <View style={[s.grid, { marginTop: 26, gap: 14 }]}>
        {TILES.map(([label, note, src, h], i) => (
          <Reveal key={label} delay={(i % 3) * 90} style={{ width: wide ? '32%' : '47.5%', flexGrow: 1 }}>
            <GalleryTile label={label} note={note} src={src} height={wide ? h : 230} />
          </Reveal>
        ))}
      </View>
    </View>
  );
}

function GalleryTile({ label, note, src, height }) {
  const z = useRef(new Animated.Value(1)).current;
  const zoom = (to) => Animated.timing(z, { toValue: to, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  return (
    <Pressable onHoverIn={() => zoom(1.07)} onHoverOut={() => zoom(1)} style={{ height, borderRadius: 22, overflow: 'hidden', backgroundColor: C.cream }}>
      <Animated.Image
        source={src}
        accessibilityLabel={`${label}: ${note}`}
        resizeMode="cover"
        style={{ width: '100%', height: '100%', transform: [{ scale: z }] }}
      />
      <View style={{ position: 'absolute', left: 12, bottom: 12, right: 12 }} pointerEvents="none">
        <Glass strong radius={16} style={{ paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' }}>
          <Text style={{ fontFamily: F.serif, fontSize: 21, color: C.heading, fontStyle: 'italic', lineHeight: 24 }}>{label}</Text>
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: C.body }}>{note}</Text>
        </Glass>
      </View>
    </Pressable>
  );
}

/* ---------- Reviews ---------- */

function Reviews({ wide, reviews }) {
  return (
    <View style={[s.section, { backgroundColor: C.ink }]}>
      <Blob color={C.rose} size={260} style={{ top: -60, left: -60, opacity: 0.35 }} dx={40} dy={30} duration={12000} />
      <Reveal><Eyebrow style={{ color: C.gold }}>Kind words</Eyebrow></Reveal>
      <Reveal delay={80}><H2 style={{ marginTop: 10, color: C.paper }}>What clients say</H2></Reveal>
      <View style={[s.grid, { marginTop: 28 }]}>
        {reviews.map((r, i) => (
          <Reveal key={r.id} delay={(i % 2) * 110} style={{ width: wide ? '48.8%' : '100%', flexGrow: 1 }}>
            <View style={s.review}>
              <Text style={{ fontFamily: F.sans, fontSize: 13, letterSpacing: 3, color: C.gold }}>{'★'.repeat(r.rating)}</Text>
              <Text style={{ fontFamily: F.serif, fontSize: 23, lineHeight: 30, color: C.paper, marginTop: 10 }}>{r.text}</Text>
              <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.goldSoft, marginTop: 14 }}>{r.name}</Text>
            </View>
          </Reveal>
        ))}
      </View>
    </View>
  );
}

/* ---------- Page extras ---------- */

function CallToAction({ go }) {
  return (
    <View style={[s.section, { backgroundColor: C.cream, alignItems: 'center', paddingVertical: 72 }]}>
      <Blob color={C.goldSoft} size={260} style={{ top: -90, left: '12%' }} dx={30} dy={26} duration={10000} />
      <Blob color={C.rose} size={150} style={{ bottom: -50, right: '14%', opacity: 0.7 }} dx={-24} dy={-20} duration={8500} />
      <Reveal style={{ alignItems: 'center' }}>
        <H2 style={{ textAlign: 'center' }}>Ready when you are</H2>
        <P style={{ textAlign: 'center', marginTop: 10, maxWidth: 440 }}>Choose a service and a time. It takes about a minute.</P>
        <Button label="Book an appointment" onPress={() => go('book')} style={{ marginTop: 26 }} />
      </Reveal>
    </View>
  );
}

function VisitInfo({ wide }) {
  return (
    <View style={[s.section, { backgroundColor: C.cream, paddingTop: 24 }]}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
        <Reveal style={{ flex: 1 }}>
          <Glass strong style={{ padding: 28 }}>
            <Eyebrow>Find us</Eyebrow>
            <Text style={s.glassBig}>{SALON.address}</Text>
            <P style={{ fontSize: 14, marginTop: 6 }}>{SALON.phone}</P>
          </Glass>
        </Reveal>
        <Reveal delay={100} style={{ flex: 1 }}>
          <Glass strong style={{ padding: 28 }}>
            <Eyebrow>Opening hours</Eyebrow>
            {SALON.hours.map(([d, h]) => (
              <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 }}>
                <Text style={{ fontFamily: F.sans, fontSize: 14.5, color: C.heading }}>{d}</Text>
                <Text style={{ fontFamily: F.sans, fontSize: 14.5, color: C.body }}>{h}</Text>
              </View>
            ))}
          </Glass>
        </Reveal>
      </View>
    </View>
  );
}

/* ---------- Footer & floating button ---------- */

function Footer({ wide, go }) {
  const open = (u) => Linking.openURL(u);
  const col = { flex: 1, minWidth: 200 };
  return (
    <View style={{ backgroundColor: C.ink, borderTopWidth: 1, borderTopColor: 'rgba(201,169,110,0.25)', paddingHorizontal: wide ? 72 : 24, paddingVertical: 56 }}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 36 }}>
        <View style={[col, { flex: 1.4 }]}>
          <Text style={[s.logo, { color: C.paper, fontSize: 30 }]}>Petals <Text style={{ color: C.rose, fontStyle: 'italic' }}>&</Text> Glam</Text>
          <Text style={s.foot}>Hair, nails, skin and lashes in {SALON.city}. Come as you are.</Text>
        </View>
        <View style={col}>
          <Text style={s.footHead}>Find us</Text>
          <Text style={s.foot}>{SALON.address}</Text>
          <Text style={s.foot}>{SALON.phone}</Text>
        </View>
        <View style={col}>
          <Text style={s.footHead}>Hours</Text>
          {SALON.hours.map(([d, h]) => <Text key={d} style={s.foot}>{d}: {h}</Text>)}
        </View>
        <View style={col}>
          <Text style={s.footHead}>Follow</Text>
          <Pressable accessibilityRole="link" onPress={() => open(`https://instagram.com/${SALON.instagram}`)}><Text style={s.foot}>Instagram</Text></Pressable>
          <Pressable accessibilityRole="link" onPress={() => open(`https://tiktok.com/@${SALON.tiktok}`)}><Text style={s.foot}>TikTok</Text></Pressable>
          <Pressable accessibilityRole="link" onPress={() => go('services')}><Text style={s.foot}>Services</Text></Pressable>
          <Pressable onPress={() => go('book')}><Text style={[s.foot, { color: C.gold }]}>Book a visit</Text></Pressable>
        </View>
      </View>
      <Text style={[s.foot, { marginTop: 40, fontSize: 12, color: C.muted }]}>© {new Date().getFullYear()} {SALON.name}</Text>
    </View>
  );
}

function WhatsAppButton({ number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    l.start();
    return () => l.stop();
  }, [pulse]);
  return (
    <View style={s.wa} pointerEvents="box-none">
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: C.gold,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
        }}
      />
      <Pressable accessibilityRole="link" accessibilityLabel="Chat with us on WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent('Hi Petals & Glam, I would like to ask about a booking.')}`)}>
        <Glass strong radius={999} style={{ paddingVertical: 14, paddingHorizontal: 22 }}>
          <Text style={{ fontFamily: F.sans, fontSize: 14, fontWeight: '600', color: C.heading }}>Chat on WhatsApp</Text>
        </Glass>
      </Pressable>
    </View>
  );
}

/* ---------- Styles ---------- */

const s = StyleSheet.create({
  navWrap: { position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 14, zIndex: 20 },
  nav: { width: '100%', maxWidth: 1140, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingLeft: 26, paddingRight: 10 },
  logo: { fontFamily: F.serif, fontSize: 26, color: C.heading, fontWeight: '600' },

  hero: { backgroundColor: C.paper, paddingTop: 92 },
  heroLeft: { paddingHorizontal: 24, paddingVertical: 48, justifyContent: 'center' },
  heroTitle: { fontFamily: F.serif, fontSize: 84, lineHeight: 84, color: C.heading, fontWeight: '500', marginTop: 16 },
  heroRight: { backgroundColor: C.cream, minHeight: 480, alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' },
  glassBig: { fontFamily: F.serif, fontSize: 32, color: C.heading, marginTop: 8, lineHeight: 36 },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 16 },
  statNum: { fontFamily: F.serif, fontSize: 40, color: C.heading, fontWeight: '500' },
  statLabel: { fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: 2 },

  section: { paddingHorizontal: 24, paddingVertical: 88, overflow: 'hidden', maxWidth: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  chip: { minHeight: 44, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: C.goldSoft },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 26, borderWidth: 1, borderColor: C.goldSoft },
  cardCat: { fontFamily: F.sans, fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: C.goldText, fontWeight: '600' },
  cardName: { fontFamily: F.serif, fontSize: 28, color: C.heading, marginTop: 6, fontWeight: '500' },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.goldSoft },
  price: { fontFamily: F.serif, fontSize: 24, color: C.goldText, fontWeight: '600' },

  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: C.goldSoft },
  dayBox: { width: 64, paddingVertical: 10, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: C.goldSoft },
  dayTop: { fontFamily: F.sans, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: C.muted },
  dayNum: { fontFamily: F.serif, fontSize: 26, color: C.heading, lineHeight: 30 },
  slot: { minHeight: 44, justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.goldSoft, backgroundColor: 'rgba(255,255,255,0.6)' },
  input: { minHeight: 48, fontFamily: F.sans, fontSize: 16, color: C.heading, borderBottomWidth: 1, borderBottomColor: C.goldSoft, paddingVertical: 12, marginBottom: 6 },
  depositRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 20, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.goldSoft },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  checkDot: { width: 8, height: 8, borderRadius: 2, backgroundColor: C.paper },
  overlay: { flex: 1, backgroundColor: 'rgba(14,12,11,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },

  review: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)', borderRadius: 22, padding: 28 },

  foot: { fontFamily: F.sans, fontSize: 14, lineHeight: 24, color: C.goldSoft, marginTop: 4 },
  footHead: { fontFamily: F.sans, fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: C.gold, fontWeight: '600', marginBottom: 8 },
  wa: { position: 'absolute', right: 18, bottom: 20, zIndex: 30 },
});
