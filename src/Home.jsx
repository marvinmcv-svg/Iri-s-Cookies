import Nav from './components/Nav'
import Hero from './components/Hero'
import Ticker from './components/Ticker'
import Deal from './components/Deal'
import Boxes from './components/Boxes'
import HowItWorks from './components/HowItWorks'
import Flavours from './components/Flavours'
import Builder from './components/Builder'
import Extras from './components/Extras'
import CartRental from './components/CartRental'
import Footer from './components/Footer'
import Checkout from './components/Checkout'
import MobileBar from './components/MobileBar'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <Deal />
        <Boxes />
        <HowItWorks />
        <Flavours />
        <Builder />
        <Extras />
        <CartRental />
      </main>
      <Footer />
      <MobileBar />
      <Checkout />
    </>
  )
}
