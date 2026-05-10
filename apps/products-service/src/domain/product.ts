export interface ProductProps {
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export class ProductEntity {
  public sku: string;
  public name: string;
  public price: number;
  public stock: number;

  constructor(props: ProductProps) {
    this.sku = props.sku;
    this.name = props.name;
    this.price = props.price;
    this.stock = props.stock;
  }

  generateSku() {
    const randomPart = () =>
      Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 36).toString(36),
      )
        .join('')
        .toUpperCase();

    this.sku = `SKU-${randomPart()}`;
  }
}
