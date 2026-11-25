import Nav from './components/Nav'
import Hero from './components/Hero'
import Ticker from './components/Ticker'
import Boxes from './components/Boxes'
import HowItWorks from './components/HowItWorks'
import Flavours from './components/Flavours'
import Builder from './components/Builder'
import Extras from './components/Extras'
import CartRental from './components/CartRental'
import WaBooking from './components/WaBooking'
import Faq from './components/Faq'
import Footer from './components/Footer'
import Checkout from './components/Checkout'
import MobileBar from './components/MobileBar'
import Concierge from './components/Concierge'

// Order follows the buying path: see the flavours → pick a size → fill the box → extras.
// "How it works", events, FAQ and the WhatsApp shortcut come after, for the people who need them.
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ticker variant="pink" />
        <Flavours />
        <Boxes />
        <Builder />
        <Extras />
        <HowItWorks />
        <CartRental />
        <Faq />
        <WaBooking />
      </main>
      <Footer />
      <MobileBar />
      <Concierge />
      <Checkout />
    </>
  )
}
