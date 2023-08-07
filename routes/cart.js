var express = require("express");
var router = express.Router();

const Cart = require("../models/Cart");

const isAuthenticated = require("../middleware/isAuthenticated");

router.get("/", isAuthenticated, (req, res, next) => {

  console.log("Getting cart")

        Cart.findOne({
          owner: req.user._id
      })
          .populate('items')
          .then((foundCart) => {
              if(!foundCart) {
                  return res.json({message: 'Your cart is empty'})
              }
              res.json(foundCart)
          })
          .catch((err) => {
              console.log(err)
              next(err)
          })
  
  });

router.post("/create", isAuthenticated, async (req, res, next) => {
  try {
    const details = req.body.details;
    console.log("Item:", details);

    const createdCart = await Cart.create({
      owner: req.user._id,
      subtotal: details.cost,
      total: Math.floor(details.cost * 1.08),
    });

    createdCart.items.push(details._id);
    createdCart.save();

    const populatedCart = await createdCart.populate('items')

    console.log("Created cart:", populatedCart);

    res.json(createdCart);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post('/update', isAuthenticated, async (req, res, next) => {

  try {

      const { itemId, cartId, itemCost } = req.body

      const toUpdate = await Cart.findById(cartId)
  
      toUpdate.subtotal = parseFloat(toUpdate.subtotal) + parseFloat(itemCost);
      toUpdate.total = Math.floor(parseFloat(toUpdate.subtotal) * 1.08);
      toUpdate.items.push(itemId)

      const newCart = await toUpdate.save()
  
      const populated = await newCart.populate('items')
          console.log("Populated:",populated)
          res.json(populated)

  } catch (err) {
      
      res.redirect(307, '/cart/create')
      console.log(err)
      next(err)
  }

})

router.post("/remove-item/:itemId", isAuthenticated, (req, res, next) => {
  const cartId = req.user.cart;
  const { itemId } = req.params;

  Cart.findByIdAndUpdate(
    cartId,
    {
      $pull: { items: itemId },
    },
    { new: true }
  )
    .populate("items")
    .then((updatedCart) => {
      res.json(updatedCart);
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});

module.exports = router;
