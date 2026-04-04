import {
  BiCog,
  BiCustomize,
  BiDollarCircle,
  BiDoughnutChart,
  BiMenu,
  BiMoneyWithdraw,
  BiRepeat,
  BiTransfer,
  BiWallet,
} from "react-icons/bi";
import { Link } from "react-router-dom";
import { useDisclosure } from "../hooks/useDisclosure";

const linkStyle: React.CSSProperties = {
  display: "flex",
  marginBlock: "1rem",
  alignItems: "center",
  gap: "1rem",
  textDecoration: "none",
  color: "inherit",
};

export function LeftDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <button
        type="button"
        className="btn"
        style={{ backgroundColor: "#bee3f8" }}
        onClick={onOpen}
      >
        <BiMenu />
        Menu
      </button>

      <div
        className={`drawer-overlay${isOpen ? " open" : ""}`}
        onClick={onClose}
      />
      <div className={`drawer-content${isOpen ? " open" : ""}`}>
        <div className="drawer-header">Menu</div>
        <div className="drawer-body">
          <Link to="/" style={linkStyle} onClick={onClose}>
            <BiDollarCircle />
            <span>Expenses</span>
          </Link>
          <Link to="/categories" style={linkStyle} onClick={onClose}>
            <BiCustomize />
            <span>Categories</span>
          </Link>
          <Link to="/wallets" style={linkStyle} onClick={onClose}>
            <BiWallet />
            <span>Wallets</span>
          </Link>
          <Link to="/recurrence" style={linkStyle} onClick={onClose}>
            <BiRepeat />
            <span>Recurrence</span>
          </Link>
          <Link to="/exchange" style={linkStyle} onClick={onClose}>
            <BiMoneyWithdraw />
            <span>Exchange</span>
          </Link>
          <Link to="/charts" style={linkStyle} onClick={onClose}>
            <BiDoughnutChart />
            <span>Charts</span>
          </Link>
          <Link to="/synonyms" style={linkStyle} onClick={onClose}>
            <BiTransfer />
            <span>Synonyms</span>
          </Link>
          <Link to="/settings" style={linkStyle} onClick={onClose}>
            <BiCog />
            <span>Settings</span>
          </Link>
          <Link to="/sync" style={linkStyle} onClick={onClose}>
            <BiTransfer />
            <span>Sync</span>
          </Link>
        </div>
      </div>
    </>
  );
}
