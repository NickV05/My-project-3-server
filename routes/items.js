var express = require("express");
var router = express.Router();

const Item = require("../models/Item");
const Comment = require("../models/Comment");
const User = require("../models/User");

const isAuthenticated = require("../middleware/isAuthenticated");
const isItemOwner = require("../middleware/isItemOwner");

router.get("/", (req, res, next) => {
  Item.find()
    .populate("owner")
    .then((allItems) => {
      console.log("Populated owners:", allItems);
      res.json(allItems);
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});

router.post("/new-item", isAuthenticated, async (req, res, next) => {
  try {
    const { cost, description, name, image, category } = req.body;

    const createdItem = await Item.create({
      owner: req.user._id,
      cost,
      description,
      name,
      category,
      image:
        image ||
        "https://res.cloudinary.com/dyto7dlgt/image/upload/v1691683955/project3/zemaik7ovkmwmc49kqbb.png",
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { listedItems: createdItem._id },
      },
      { new: true }
    );

    console.log("Created Item:", createdItem);
    console.log("Updated user:", updatedUser);

    res.json(createdItem);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/item-detail/:itemId", (req, res, next) => {
  const { itemId } = req.params;

  Item.findById(itemId)
    .populate({
      path: "comments",
      populate: { path: "author" },
    })
    .populate("owner")
    .then((populatedItem) => {
      console.log("PopulatedItem:", populatedItem);
      res.json(populatedItem);
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});

router.post(
  "/item-update/:itemId",
  isAuthenticated,
  isItemOwner,
  (req, res, next) => {
    const { itemId } = req.params;

    const { cost, description, name, image, category } = req.body;

    Item.findByIdAndUpdate(
      itemId,
      {
        cost,
        description,
        name,
        image,
        category,
      },
      { new: true }
    )
      .then((updatedItem) => {
        res.json(updatedItem);
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  }
);

router.post(
  "/delete-item/:itemId",
  isAuthenticated,
  isItemOwner,
  (req, res, next) => {
    const { itemId } = req.params;

    Item.findByIdAndDelete(itemId)
      .then((deletedItem) => {
        res.json(deletedItem);
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  }
);

router.post("/add-comment/:itemId", isAuthenticated, (req, res, next) => {
  const { itemId } = req.params;
  Comment.create({
    author: req.user._id,
    comment: req.body.comment,
    item: itemId,
  })
    .then((createdComment) => {
      console.log("Created comment:", createdComment);
      Item.findByIdAndUpdate(
        req.params.itemId,
        {
          $push: { comments: createdComment._id },
        },
        { new: true }
      )
        .populate({
          path: "comments",
          populate: { path: "author" },
        })
        .then((updatedItem) => {
          console.log("Updated item:", updatedItem);
          res.json(updatedItem);
        })
        .catch((err) => {
          console.log(err);
          next(err);
        });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});

router.post("/delete-review/:reviewId", isAuthenticated, (req, res, next) => {
  const { reviewId } = req.params;

  Comment.findById(reviewId)
    .populate("item")
    .then((populatedReview) => {
      console.log("Populated review:", populatedReview);
      return Item.findByIdAndUpdate(
        populatedReview.item._id,
        {
          $pull: { comments: reviewId },
        },
        { new: true }
      );
    })
    .then((updatedItem) => {
      console.log("Updated item:", updatedItem);
      res.redirect(`/items/item-detail/${updatedItem._id}`);
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});

router.post("/review-update/:reviewId", isAuthenticated, (req, res, next) => {
  const { reviewId } = req.params;

  const { comment } = req.body;

  Comment.findByIdAndUpdate(
    reviewId,
    {
      comment,
    },
    { new: true }
  )
    .then((updatedReview) => {
      res.json(updatedReview);
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
});

module.exports = router;
