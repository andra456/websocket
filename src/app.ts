/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable comma-dangle */
/* eslint-disable semi */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import responseTime from "response-time";
import cors from "cors";
import bodyParser from "body-parser";
import handlebars from "express-handlebars";
import { handleRoutes } from "./socketBridge";
import jwt from "jsonwebtoken";

const app = express();
const router = express.Router();

const jwtKey = "sf7jwt";

// view engine setup

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

router.use(helmet());
router.use(responseTime());
router.use(cors(corsOptions));
router.use(cookieParser());

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(
  bodyParser.json({
    limit: "5mb",
  })
);

app.engine(
  "html",
  handlebars({
    helpers: {
      toJson: (object: unknown) => JSON.stringify(object),
    },
  })
);
//====================
app.get("/api/profile", verifyToken, (req, res) => {});

//Verify Token
function verifyToken(req: any, res: any, next: any) {
  //Auth header value = > send token into header

  const bearerHeader = req.headers["authorization"];
  //check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    //split the space at the bearer
    const bearer = bearerHeader.split(" ");
    //Get token from string
    const bearerToken = bearer[1];
    //set the token
    req.token = bearerToken;

    //next middleweare
    jwt.verify(req.token, jwtKey, (err: any, authData: any) => {
      if (err) res.sendStatus(403);
      else {
        next();
      }
    });
  } else {
    //Fobidden
    res.sendStatus(403);
  }
}
app.post("/auth", (req, res) => {
  //you can do this either synchronously or asynchronously
  //if synhronously, you can set a variable to jwt sign and pass it into the payload with secret key
  //if async => call back

  //Mock user
  const user = {
    id: Date.now(),
    ...req.body,
  };

  //send abpve as payload
  jwt.sign({ user }, jwtKey, (err: any, token: any) => {
    res.json({
      token,
    });
  });
});
//====================
app.post("/notification", cors(corsOptions), verifyToken, handleRoutes);
app.use(router);

export default app;
