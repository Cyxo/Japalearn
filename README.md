# Japatrain

Japatrain is a groundbreaking web and mobile application to learn Japanese which uses machine learning to help you progress.

*This software is distributed under the Creative Commons Attribution-NonCommercial-NoDerivatives licence. Any breach of this licence will be prosecuted.*

## Basic setup

If you want to host your own instance of Japatrain, just make sure you copy the `.env.example` file to a `.env` file and fill in the fields accordingly. Get your AWS API credentials following [this guide](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html).

Then install the required dependencies with `npm install` and run the app using `node index.js`.

*Beware that you need to have Python in order for tensorflow-js to work.*