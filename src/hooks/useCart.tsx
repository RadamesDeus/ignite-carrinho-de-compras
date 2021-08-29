import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`products/${productId}`);
      const product = response.data as Product;

      const responseStock = await api.get(`stock/${productId}`);
      const stock = responseStock.data as Stock;

      if (product) {
        let newCart = [...cart];
        const cartIndex = newCart.findIndex((c) => c.id === productId);

        if (cartIndex > -1 && stock) {
          if (stock.amount === newCart[cartIndex].amount) {
            throw toast.error("Quantidade solicitada fora de estoque");
          }

          newCart[cartIndex].amount += 1;
        } else {
          product.amount = 1;
          newCart.push(product);
        }

        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let newCart = [...cart];

      const cartIndex = newCart.findIndex((c) => c.id === productId);

      if (cartIndex === -1) {
        throw toast.error("Erro na remoção do produto");
      }

      newCart.splice(cartIndex, 1);
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get(`stock/${productId}`);
      const stock = responseStock.data as Stock;

      let newCart = [...cart];

      const cartIndex = newCart.findIndex((c) => c.id === productId);

      if (cartIndex > -1 && stock) {
        let cartIndexamount = newCart[cartIndex].amount;
        let newAmount = cartIndexamount + amount;
        if (newAmount <= 0 || newAmount > stock.amount || stock.amount === 1) {
          throw toast.error("Quantidade solicitada fora de estoque");
        }

        newCart[cartIndex].amount += amount > 1 ? 1 : -1;

        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        throw toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
