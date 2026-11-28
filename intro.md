# Steam Recommender Systems Project

```{image} assets/steam.svg
:alt: Steam logo
:width: 120px
:align: center
```

## Steam and game prices

Steam is a digital game store and platform which hosts and distributes a variety of games. Steam is often claimed as the main gaming platform, having hundreds of thousands of active monthly users at any one time. Tens of thousands of games are readily accessible on Steam from behemoth titles like *Elden Ring* to smaller indie games like *Stray* and *Celeste*. Likewise, the pricing of these games can wildly vary; *Elden Ring* costs \$59.99 without discount while there are also thousands of free to play games like *Counter Strike 2*.   

::::{grid} 1 2 4 4

:::{figure} assets/games/elden_ring.jpg
:alt: Elden Ring store header
*Elden Ring*, \$59.99
:::

:::{figure} assets/games/stray.jpg
:alt: Stray store header
*Stray*, \$29.99
:::

:::{figure} assets/games/celeste.jpg
:alt: Celeste store header
*Celeste*, \$19.99
:::

:::{figure} assets/games/counter_strike_2.jpg
:alt: Counter-Strike 2 store header
*Counter-Strike 2*, free
:::

::::

## Can we predict the price of the next game a user reviews?

Each user likely has a pricing preference. Some users are completely free to play, while others willingly spend hundreds or even thousands of dollars on major expensive titles. We are interested in examining this user pricing preference and potentially anticipate their purchasing behavior. **Given a user’s Steam review history, can we predict the price of the next Steam game that user will review?** Understanding their pricing preferences will 1\. help determine accurate revenue forecasts for Steam and 2\. determine a user’s comfortable price range to improve game recommendations for that user.   

```{anywidget} demos/user_timeline.js
{"url": "user_timelines.json", "start": "76561198329978687"}
```

## Evaluation

To evaluate this model, we split our model into a train, validation, and test set based on date percentiles. The most recent 10% of reviews is our test set, the second most recent 10% of reviews is our validation set, and the remaining 80% is our train set. We will also have to handle cold start cases where a user exists in the test dataset but not in the train nor validation sets.

```{anywidget} demos/split_timeline.js
{"url": "split_timeline.json", "view": "split"}
```

By splitting by date percentiles, we help reduce data leakage. For example, if Steam is interested in the price of the game you will next review - they wouldn' thave any data on the future (trends, sentiment, games that haven't been announced anywhere, etc). If you were to randomize the entire data 80% (test) / 10% (val) / 10% (test), then the model will have knowledge on trends, sentiment, etc of the test set. Our modeling for this reason is only looking at data up to a certain date to predict the price of the next game that would be reviewed. 

```{anywidget} demos/split_timeline.js
{"url": "split_timeline.json", "view": "visible"}
```

### Metrics

Because our task is a regression problem, we will use the following metrics, where $y_i$ is the true price of the $i$-th of $n$ test reviews and $\hat{y}_i$ is our prediction:

1. Mean Absolute Error (MAE): Used an easily interpretable metric.

   $$
   \mathrm{MAE} = \frac{1}{n} \sum_{i=1}^{n} \left| y_i - \hat{y}_i \right|
   $$

2. Mean Squared Error (MSE): Used to blow up large errors.

   $$
   \mathrm{MSE} = \frac{1}{n} \sum_{i=1}^{n} \left( y_i - \hat{y}_i \right)^2
   $$

3. Mean Squared Log Error (MSLE): To balance errors in the low price range vs high price range. For example, predicting the next game is free when it’s \$30 is significantly worse than predicting \$70 when it’s \$100: the first adds $(\log 31 - \log 1)^2 \approx 11.8$, the second only $(\log 101 - \log 71)^2 \approx 0.12$.

   $$
   \mathrm{MSLE} = \frac{1}{n} \sum_{i=1}^{n} \left( \log(1 + y_i) - \log(1 + \hat{y}_i) \right)^2
   $$

### Baselines

We will also examine the following baselines:

1. Using the second most recent game price.  
2. Taking the median price of the user’s review history.  
3. Using a weighted average of the user’s review history with more weight on recent purchases.  
4. A linear regression model using only user features and purchase history features without recommender system elements.  
5. Markov Chains without additional features.

We will evaluate our final model by comparing its evaluation metrics to the above listed baselines.  

## Limitations

There are various limitations that will be open for future studies. We won’t account for frequent steam sales which can often run as high as 80-95% off. Free to play games often have in-game microtransactions whose pricing data aren’t present in the dataset. We’re assuming that a user will review every game they have purchased; however, it’s likely that a user purchases or even plays a game but doesn’t review it. Lastly, more than one person might be using the same steam account, blending pricing preferences. All of these factors will inevitably add bias to our results. 

## Data

We use the Steam Video Game and Bundle Data from Professor McAuley's lab at UCSD [@kang2018sasrec; @wan2018chains; @pathak2017bundles].

| File | Contents |
|---|---|
| `steam_games.json` | 32,135 games with price, genres, tags and release date |
| `steam_reviews.json` | 7,793,069 reviews with the game, date and hours played |
| `australian_users_items.json` | 88,310 Australian users' game libraries with playtime per game |
| `australian_user_reviews.json` | 59,305 reviews by Australian users, each marked recommend or not |