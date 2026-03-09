import {
  BiCog,
  BiCustomize,
  BiDollarCircle,
  BiDoughnutChart,
  BiMenu,
  BiRepeat,
  BiWallet,
} from "react-icons/bi";
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
          <a href="/" style={linkStyle}>
            <BiDollarCircle />
            <span>Expenses</span>
          </a>
          <a href="/categories" style={linkStyle}>
            <BiCustomize />
            <span>Categories</span>
          </a>
          <a href="/wallets" style={linkStyle}>
            <BiWallet />
            <span>Wallets</span>
          </a>
          <a href="/recurrence" style={linkStyle}>
            <BiRepeat />
            <span>Recurrence</span>
          </a>
          <a href="/charts" style={linkStyle}>
            <BiDoughnutChart />
            <span>Charts</span>
          </a>
          <a href="/settings" style={linkStyle}>
            <BiCog />
            <span>Settings</span>
          </a>
        </div>
      </div>
    </>
  );
}
