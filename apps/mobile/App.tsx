import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Session, api } from './src/api';

type Screen = 'Splash' | 'Login' | 'Register' | 'Dashboard' | 'Apply' | 'Loan' | 'Payments' | 'Profile';

const products = [
  { id: 'starter', name: 'Starter Loan', min: 100, max: 1000, rate: 12, fees: 15, days: 30 },
  { id: 'boost', name: 'Business Boost', min: 1000, max: 10000, rate: 18, fees: 75, days: 90 }
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('Splash');
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('500');
  const [availableProducts, setAvailableProducts] = useState(products);
  const [product, setProduct] = useState(products[0]);
  const [profile, setProfile] = useState<any>(null);
  const total = useMemo(() => {
    const principal = Number(amount || 0);
    return principal + principal * (product.rate / 100) + product.fees;
  }, [amount, product]);

  useEffect(() => {
    if (!session?.accessToken || session.accessToken === 'demo-token') return;
    api.products(session.accessToken)
      .then(items => {
        const mapped = items.map(item => ({
          id: item.id,
          name: item.name,
          min: Number(item.minimumAmount),
          max: Number(item.maximumAmount),
          rate: Number(item.interestRate),
          fees: Number(item.fees),
          days: item.durationDays
        }));
        if (mapped.length) {
          setAvailableProducts(mapped);
          setProduct(mapped[0]);
        }
      })
      .catch(() => undefined);
    api.profile(session.accessToken).then(setProfile).catch(() => undefined);
  }, [session]);

  if (screen === 'Splash') {
    return <SafeAreaView style={styles.splash}><Text style={styles.logo}>MobiFund</Text><Text style={styles.tagline}>Fast mobile loans, clear repayments.</Text><Button label="Get started" onPress={() => setScreen('Login')} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.brand}>MobiFund</Text><Text style={styles.status}>KYC Pending</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        {!!message && <Text style={styles.notice}>{message}</Text>}
        {screen === 'Login' && <Form title="Welcome back" fields={['Email', 'Password']} action="Login" onAction={async values => {
          try {
            const next = await api.login(values.Email || 'customer@mobifund.local', values.Password || 'Customer123!');
            setSession(next);
            setMessage('Signed in');
          } catch {
            setSession({ accessToken: 'demo-token', user: { id: 'demo', name: 'Demo Customer', email: 'customer@mobifund.local', role: 'CUSTOMER' } });
            setMessage('API offline, using demo session');
          }
          setScreen('Dashboard');
        }} swap="Create account" onSwap={() => setScreen('Register')} />}
        {screen === 'Register' && <Form title="Create account" fields={['Full name', 'Phone number', 'Email', 'Password', 'Date of birth', 'NRC number', 'Address', 'Employment or business', 'Repayment phone number']} action="Register" onAction={async values => {
          const payload = {
            name: values['Full name'],
            phone: values['Phone number'],
            email: values.Email,
            password: values.Password,
            nrcNumber: values['NRC number'],
            address: values.Address,
            employment: values['Employment or business'],
            repaymentPhone: values['Repayment phone number']
          };
          try {
            setSession(await api.register(payload));
            setMessage('Account created');
          } catch {
            setSession({ accessToken: 'demo-token', user: { id: 'demo', name: payload.name || 'Demo Customer', email: payload.email || 'customer@mobifund.local', role: 'CUSTOMER' } });
            setMessage('API offline, saved as demo session');
          }
          setScreen('Dashboard');
        }} swap="Already registered" onSwap={() => setScreen('Login')} />}
        {screen === 'Dashboard' && <Dashboard go={setScreen} />}
        {screen === 'Apply' && (
          <View>
            <Text style={styles.title}>Apply for a loan</Text>
            {availableProducts.map(item => <TouchableOpacity key={item.id} style={[styles.card, item.id === product.id && styles.selected]} onPress={() => setProduct(item)}><Text style={styles.cardTitle}>{item.name}</Text><Text>K{item.min} - K{item.max} - {item.rate}% - {item.days} days</Text></TouchableOpacity>)}
            <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="Requested amount" />
            <View style={styles.card}><Text style={styles.cardTitle}>Repayment estimate</Text><Text>Principal: K{Number(amount || 0).toFixed(2)}</Text><Text>Fees: K{product.fees.toFixed(2)}</Text><Text>Total: K{total.toFixed(2)}</Text></View>
            <Button label="Submit application" onPress={async () => {
              try {
                if (!session?.accessToken || session.accessToken === 'demo-token') throw new Error('demo');
                await api.apply(session.accessToken, product.id, Number(amount));
                setMessage('Loan application submitted');
              } catch {
                setMessage('Application saved in demo mode');
              }
              setScreen('Loan');
            }} />
          </View>
        )}
        {screen === 'Loan' && <Info title="Loan details" rows={['Status: Pending approval', `Requested: K${amount}`, `Estimated repayment: K${total.toFixed(2)}`, 'Next step: admin review']} />}
        {screen === 'Payments' && <Info title="Payments" rows={['Payment method: manual transfer or cash reference', 'Submit your payment reference for admin confirmation', 'Receipts become available after confirmation']} />}
        {screen === 'Profile' && <Info title="Profile and KYC" rows={[`Name: ${profile?.user?.name ?? session?.user.name ?? 'Demo Customer'}`, `NRC: ${profile?.nrcNumber ?? '123456/78/9'}`, `Documents: ${profile?.documents?.length ?? 0} uploaded`, `Verification: ${profile?.verificationStatus ?? 'Pending'}`]} />}
      </ScrollView>
      <View style={styles.nav}>{(['Dashboard', 'Apply', 'Payments', 'Profile'] as Screen[]).map(item => <TouchableOpacity key={item} onPress={() => setScreen(item)}><Text style={[styles.navText, screen === item && styles.navActive]}>{item}</Text></TouchableOpacity>)}</View>
    </SafeAreaView>
  );
}

function Dashboard({ go }: { go: (screen: Screen) => void }) {
  return <View><Text style={styles.title}>Loan dashboard</Text><View style={styles.hero}><Text style={styles.heroLabel}>Outstanding balance</Text><Text style={styles.heroAmount}>K0.00</Text><Text>Next payment: No active loan</Text></View><Button label="Apply for loan" onPress={() => go('Apply')} /><Info title="History" rows={['No repayments yet', 'No disbursements yet']} /></View>;
}

function Form(props: { title: string; fields: string[]; action: string; swap: string; onAction: (values: Record<string, string>) => void | Promise<void>; onSwap: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  return <View><Text style={styles.title}>{props.title}</Text>{props.fields.map(f => <TextInput key={f} style={styles.input} placeholder={f} value={values[f] ?? ''} onChangeText={text => setValues(current => ({ ...current, [f]: text }))} secureTextEntry={f === 'Password'} />)}<Button label={props.action} onPress={() => props.onAction(values)} /><TouchableOpacity onPress={props.onSwap}><Text style={styles.link}>{props.swap}</Text></TouchableOpacity></View>;
}

function Info({ title, rows }: { title: string; rows: string[] }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{rows.map(row => <Text key={row} style={styles.row}>{row}</Text>)}</View>;
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7faf9' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, backgroundColor: '#f7faf9' },
  logo: { fontSize: 42, fontWeight: '800', color: '#087f5b' },
  tagline: { fontSize: 16, color: '#43544d' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  brand: { fontSize: 24, fontWeight: '800', color: '#087f5b' },
  status: { color: '#7a5c00', backgroundColor: '#fff3bf', padding: 8, borderRadius: 6 },
  content: { padding: 18, paddingBottom: 96, gap: 14 },
  title: { fontSize: 28, fontWeight: '800', color: '#14231d', marginBottom: 14 },
  hero: { backgroundColor: '#087f5b', borderRadius: 8, padding: 20, marginBottom: 16 },
  heroLabel: { color: '#d3f9d8' },
  heroAmount: { color: 'white', fontSize: 36, fontWeight: '800', marginVertical: 8 },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 12, borderColor: '#e1e8e4', borderWidth: 1 },
  selected: { borderColor: '#087f5b', borderWidth: 2 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, color: '#14231d' },
  row: { marginTop: 6, color: '#43544d' },
  input: { backgroundColor: 'white', borderColor: '#d9e4de', borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 10 },
  notice: { backgroundColor: '#e6fcf5', borderColor: '#96f2d7', borderWidth: 1, borderRadius: 8, padding: 12, color: '#087f5b', fontWeight: '700', marginBottom: 12 },
  button: { backgroundColor: '#087f5b', padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  buttonText: { color: 'white', fontWeight: '800' },
  link: { color: '#087f5b', textAlign: 'center', marginTop: 10 },
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', padding: 14, borderTopColor: '#e1e8e4', borderTopWidth: 1 },
  navText: { color: '#66756e', fontWeight: '700' },
  navActive: { color: '#087f5b' }
});
