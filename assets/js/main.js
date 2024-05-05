// Inicia el proceso cuando el DOM esté completamente cargado
let allProducts = [];

function fetchProducts() {
    return fetch("assets/js/products.json")
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            showProdStore(allProducts); // llamar a showProdStore aquí para asegurar que se ejecuta después de cargar los productos
            updateCartUI();
        })
        .catch(error => {
            console.error(error);
            showAlert("Failed to load products. Please try again later.", "error");
        });
}
function cardTemplate(product, isStore) {
    if (isStore) {
        return `
            <div class="col">
                <div class="card">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}" width="100" height="200">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <hr />
                        <p>Price: $${product.price}</p>
                    </div>
                    <div class="card-footer text-center">
                        <button type="button" class="btn btn-primary" id="add-product-${product.id}">
                            Add
                        </button>
                    </div>
                </div>
            </div>
            `
    } else {
        return `
            <div class="col" id="card-${product.id}">
                <div class="card">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                    </div>
                    <div class="card-footer d-flex justify-content-around align-items-center">
                        <button type="button" class="btn btn-primary" id="decrease-${product.id}">-</button>
                        <p class="m-0" id="amount-product-${product.id}">${product.amount}</p>
                        <button type="button" class="btn btn-primary" id="increase-${product.id}">+</button>
                    </div>
                </div>
            </div>
        `
    }
}
// Asegurarse de llamar a attachStoreEventHandlers después de cualquier actualización del carrito también
function updateCartUI() {
    let prodCart = document.getElementById("cart_products");
    let productsInCart = allProducts.filter(product => {
        let storedProd = JSON.parse(localStorage.getItem(product.id));
        return storedProd && storedProd.amount > 0;
    });

    if (productsInCart.length > 0) {
        if (!prodCart) {
            createSectionCart();
            prodCart = document.getElementById("cart_products");
        }
        prodCart.innerHTML = "";
        productsInCart.forEach(product => {
            const cardHTML = cardTemplate(product, false);
            prodCart.insertAdjacentHTML('beforeend', cardHTML);
        });
        attachCartEventHandlers(productsInCart);
    } else {
        deleteSectionCart();
    }

    attachStoreEventHandlers();
    calculateTotal();
}

function attachCartEventHandlers(productsInCart) {
    productsInCart.forEach(prod => {
        let addButton = document.getElementById(`increase-${prod.id}`);
        let decreaseButton = document.getElementById(`decrease-${prod.id}`);
        if (addButton && decreaseButton) {
            addButton.onclick = () => increaseAmount(prod.id);
            decreaseButton.onclick = () => decreaseAmount(prod.id);
        }
    });
}

function attachStoreEventHandlers() {
    allProducts.forEach(prod => {
        let addButton = document.getElementById(`add-product-${prod.id}`);
        if (addButton) {
            addButton.onclick = () => addProdCart(prod.id);
        }
    });
}

function showProdStore(products) {
    let prodStore = document.getElementById("products");
    prodStore.innerHTML = "";

    // Crear y añadir cada tarjeta de producto al DOM
    products.forEach(prod => {
        const prodCardHTML = cardTemplate(prod, true);
        prodStore.insertAdjacentHTML('beforeend', prodCardHTML);
    });

    // Adjuntar eventos después de que todos los elementos estén en el DOM
    attachStoreEventHandlers();
}

function addProdCart(prodId) {
    let prod = allProducts.find(product => product.id === prodId);
    let storedProd = JSON.parse(localStorage.getItem(prodId));

    if (storedProd) {
        storedProd.amount += 1;
    } else {
        storedProd = { ...prod, amount: 1 };
    }

    localStorage.setItem(prodId, JSON.stringify(storedProd));
    updateCartUI();
    showAlert("Product added to cart successfully", "success");
}

function createSectionCart() {
    if (!document.getElementById("cart")) {
        let contentContainer = document.getElementById("content-container");
        let seccionProd = document.getElementById("section_products");
        seccionProd.className = "col-10 p-3";
        contentContainer.innerHTML += `
            <section class="col-2 p-3" id="cart">
                <h1>Cart</h1>
                <div class="row row-cols-1 g-4 mt-2" id="cart_products">
                    <!-- Cart Content -->
                </div>
                <div class="row mt-5">
                    <div class="col" id="checkout">
                    </div>
                </div>
            </section>
        `;
    }
    updateCartUI();
}

function deleteSectionCart() {
    let cart = document.getElementById("cart");
    if (cart) {
        let seccionProd = document.getElementById("section_products");
        seccionProd.className = "col-12 p-3";
        cart.remove();
    }
    showProdStore(allProducts);
}

function increaseAmount(prodId) {
    let product = allProducts.find(p => p.id === prodId);
    let storedProd = JSON.parse(localStorage.getItem(prodId)) || { ...product, amount: 0 };
    storedProd.amount += 1;
    localStorage.setItem(prodId, JSON.stringify(storedProd));
    updateCartUI();
}

function decreaseAmount(prodId) {
    let storedProd = JSON.parse(localStorage.getItem(prodId));
    if (storedProd.amount > 1) {
        storedProd.amount -= 1;
        localStorage.setItem(prodId, JSON.stringify(storedProd));
    } else {
        localStorage.removeItem(prodId);
    }
    updateCartUI();
}

function calculateTotal() {
    let containerCheckoutButton = document.getElementById("checkout");
    let total = allProducts.reduce((acc, prod) => {
        let storedProd = JSON.parse(localStorage.getItem(prod.id));
        return storedProd ? acc + storedProd.amount * prod.price : acc;
    }, 0);
    let totalRounded = total.toFixed(2);

    let checkoutButton = document.getElementById("checkoutButton");
    if (isNaN(parseFloat(totalRounded)) || total === 0) {
        if (checkoutButton) {
            checkoutButton.remove(); // Eliminar el botón si no es necesario
        }
    } else {
        if (!checkoutButton) {
            checkoutButton = document.createElement('button');
            checkoutButton.id = 'checkoutButton';
            checkoutButton.className = 'btn btn-primary col-12';
            checkoutButton.addEventListener('click', payment);
            containerCheckoutButton.appendChild(checkoutButton);
        }
        checkoutButton.innerText = `Pay $${parseFloat(totalRounded)}`;
    }
}

async function payment() {
    const { value: payMethod } = await Swal.fire({
        title: "Select payment option.",
        input: "select",
        inputOptions: {
            Cards: {
                credit: "Credit Card",
                debit: "Debit Card",
                paypal: "Paypal",
            },
            Cryptos: {
                bitcoin: "BitCoin",
                etherium: "Etherium"
            }
        },
        inputPlaceholder: "Select a payment method.",
        showCancelButton: true,
        inputValidator: (value) => {
            return new Promise((resolve) => {
                if (value === "paypal") {
                    resolve();
                } else {
                    resolve("You only have registered Paypal method.");
                }
            });
        }
    });
    if (payMethod) {
        const amount = checkoutButton.innerText.replace("Pay ", "");
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger"
            },
            buttonsStyling: false
        });
        swalWithBootstrapButtons.fire({
            title: `You will pay ${amount} through ${payMethod.toUpperCase()}. Are you sure?`,
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, pay it!",
            cancelButtonText: "No, Cancel!",
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                deleteSectionCart();
                swalWithBootstrapButtons.fire({
                    title: "Payment completed!",
                    text: "Your products are paid.",
                    icon: "success"
                });
            } else if (
                result.dismiss === Swal.DismissReason.cancel
            ) {
                swalWithBootstrapButtons.fire({
                    title: "Cancelled",
                    text: "Your money is safe :)",
                    icon: "error"
                });
            }
        });
    }
}

function showAlert(title, icon) {
    Swal.fire({
        title: title,
        position: "top",
        icon: icon,
        timer: 1000,
        timerProgressBar: true,
        showConfirmButton: false
    });
}

function main(){
    document.addEventListener('DOMContentLoaded', () => {
        fetchProducts();
    });
}


main()