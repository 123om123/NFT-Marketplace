import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import Web3 from "web3";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
let timeArr = [];
let seriesArr = [];
let currentCollection;

export default function Home() {
  let [balance, setBalance] = useState(null);
  let [NFTS, setNFTS] = useState(null);
  let [options, setOptions] = useState({});
  let [series, setSeries] = useState([{}]);
  let web3 = new Web3("https://mainnet.infura.io/v3/85053130ed044a1593252260977bbeb5");
  let address = "0x7e99430280a0640a4907ccf9dc16c3d41be6e1ed";
  web3.eth.getBalance(address, (err, bal) => {
    bal = web3.utils.fromWei(bal.toString(), "ether");
    setBalance(bal);
  });

  function groupBy(arr, property) {
    return arr.reduce(function (memo, x) {
      if (!memo[x[property]]) {
        memo[x[property]] = [];
      }
      memo[x[property]].push(x);
      return memo;
    }, {});
  }

  let getNFTS = function () {
    fetch(
      `https://deep-index.moralis.io/api/v2/${address}/nft?chain=eth&format=decimal&order=token_address.ASC`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-api-key": "Q3Zg3JYiD2uaEbeyeVtHVOfdQDN2ERvqqVX7M15HHa2kXq1uBIy1BpM9hk918OLV",
        },
      }
    ).then((nfts) => {
      nfts.json().then((nfts) => {
        nfts = groupBy(nfts.result, "name");
        nfts = Object.entries(nfts);
        setNFTS(nfts);
        console.log("nfts found");
      });
    });
  };

  let getFloorPrice = function (collection_addr, collection_name) {
    return function () {
      let collectionChanged;
      if (currentCollection == collection_name) {
        let today = new Date();
        let date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let dateTime = date + " " + time;
        timeArr.push(dateTime);
        collectionChanged = false;
      } else {
        let today = new Date();
        let date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let dateTime = date + " " + time;
        timeArr = [];
        timeArr.push(dateTime);
        currentCollection = collection_name;
        collectionChanged = true;
      }
      fetch(`https://api.opensea.io/api/v1/collections?asset_owner=${address}&offset=0&limit=300`).then(
        (collections) => {
          collections.json().then((collections) => {
            collections.map((collection) => {
              if (collectionChanged) {
                seriesArr = [];
              }
              if (collection_addr == collection?.primary_asset_contracts[0]?.address) {
                seriesArr.push(collection.stats.floor_price);
                setOptions({
                  xaxis: {
                    categories: timeArr,
                  },
                });
                setSeries([{ name: collection_name, data: seriesArr }]);
              }
            });
          });
        }
      );
    };
  };

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
        <script src="https://cdn.jsdelivr.net/npm/react-apexcharts"></script>
      </Head>

      <div className={styles.container}>
        <div className={`${styles.topLeft} ${styles.card}`}>
          <h1 style={{ fontFamily: "playfair display", fontWeight: 900 }}>User Balance:</h1>
          <h4 style={{ fontFamily: "roboto slab", fontWeight: 200 }}>
            {balance} <b style={{ fontFamily: "playfair display", fontWeight: 900 }}>ETH</b>
          </h4>
        </div>
        <div
          style={{
            width: "66%",
            height: "82%",
            border: "1px solid #dedede",
            borderRadius: "20px",
            padding: "1rem",
            position: "relative",
            overflowY: "scroll",
          }}>
          {/* <button
            className={styles.btnBig}
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              zIndex: "999999",
              fontFamily: "roboto slab",
            }}
            onClick={}>
            Refresh
          </button> */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {NFTS ? (
              NFTS.map((collection) => {
                return (
                  <>
                    <div style={{ float: "none", width: "100%" }}>
                      <div>
                        <h1>
                          {collection[0]}
                          <button
                            onClick={getFloorPrice(collection[1][0].token_address, collection[0])}
                            style={{ margin: "0 0 0 1rem" }}
                            className={styles.btnBig}>
                            View Floor Price Graph
                          </button>
                        </h1>
                        <hr></hr>
                      </div>
                      {collection[1].map((nft) => {
                        let nft_metadata = JSON.parse(nft.metadata);
                        return (
                          <div
                            className={styles.card}
                            style={{
                              float: "left",
                              width: "30%",
                              height: "21rem",
                              margin: "1rem",
                              position: "relative",
                              textAlign: "center",
                            }}>
                            <h2 style={{ margin: "1rem" }}>{nft_metadata.name}</h2>
                            <img
                              src={`${nft_metadata.image}`}
                              style={{
                                width: "150px",
                                margin: "9% auto",
                                border: "1px solid #dedede",
                                borderRadius: "10px",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <br />
                  </>
                );
              })
            ) : (
              <h1
                style={{
                  height: "fit-content",
                  width: "fit-content",
                  margin: "auto",
                  fontFamily: "playfair display",
                }}>
                Loading...{getNFTS()}
              </h1>
            )}
          </div>
        </div>
      </div>
      <div
        className={styles.topRight}
        style={{ position: "absolute", width: "15%", height: "20%", margin: "10rem 1rem" }}>
        <h1>{currentCollection}</h1>
        <Chart
          id="floorPriceChart"
          options={options}
          series={series}
          type="line"
          width="100%"
          height="100%"></Chart>
      </div>
    </>
  );
}
