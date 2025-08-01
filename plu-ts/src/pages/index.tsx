// pages/index.tsx
import ConnectEternlWallet from '../components/walletconnect';
import SendAdaTestPreprod from '../components/sendada';
import DisplayContractAddress from '../components/Displaycontractaddress'
const HomePage: React.FC = () => (
  <main>
    <h1>Welcome to My Cardano dApp</h1>
    <ConnectEternlWallet />
    <SendAdaTestPreprod />
    <DisplayContractAddress />
  </main>
);

export default HomePage;
