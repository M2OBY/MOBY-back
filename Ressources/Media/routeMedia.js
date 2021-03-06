//********************************************** */
// Ce fichier contient les différentes routes
//pour les services concernant le Media
//*********************************************** */
const express = require('express')
const router = express.Router()
const actionMedia = require ('./actionMedia')
const actionPartage = require ('./PartageFile/actionPartage')
const passport = require('passport')
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const secret = require('../../config/secret').secretKey;
let fs      = require('fs'),
    path    = require('path'),
    async   = require('async');

const isAuthenticated = (req,res,next) => {

    if(req.isAuthenticated()){
        return next()

    }else{
        req.flash('error','il faut senregistrer avant! ')
        res.redirect('/')

    }
}



//Autorisation
const isNotAuthenticated = (req,res,next) => {

    if(req.isAuthenticated()){
        req.flash('error','désoler vous êtes déjà connecter')
        res.redirect('/')

    }else{
        return next()

    }
}

router.route('/Gestion')
    .get(isAuthenticated,(req, res) => {
        console.log('req.user************************',req.user)
      actionMedia.afficheMedia(req,res)
      
        
    })

router.route('/')
    .get(isAuthenticated,(req, res) => {
        console.log('req.user',req.user)
        res.render('uploadFile',{username:req.user.username});
    })
    .post( isAuthenticated, (req, res)  => {
        actionMedia.uploadMedia(req,res);
    })

    router.route('/partage')
    .post( isAuthenticated, (req, res)  => {
        //actionMedia.partageMedia(req,res);
        actionPartage.partageFile(req,res);
    })

router.route('/parse/')
     .post(isAuthenticated,(req, res) => {

        actionMedia.parseMedia(req,res)
    }) 

    .get(isAuthenticated,async (req, res) => {
        

         actionMedia.afficheMedia(req,res)

           //res.render('Parse',{data:data})

       // res.render('Parse',{username:req.user.username});
    })
router.route('/find/')
    .post(isAuthenticated,(req, res) => {
        actionMedia.parseMedia(req,res)
    })

    .get(isAuthenticated,async (req, res) => {

        actionMedia.recherchePageMedia(req,res)

        // res.render('Parse',{data:data})

        // res.render('Parse',{username:req.user.username});
    })


    router.route('/supprimer/')
    .post(isAuthenticated,async(req, res) => {
         console.log("test::!!!!!!!!!!!!")
        actionMedia.supprimerMedia(req,res)
    })

// -- LIRE UN REPERTOIRE
     router.route('/files')
         .get( function (req, res) {
    let myDir = [];
    fs.readdir(path.join(__dirname+'/files'),(err, result)=>{
        async.each(result,(file, callback) => {
            // --
            fs.stat(path.join(__dirname+'/files',file), (err, stat) => {
                if(stat.isFile()){
                    myDir.push('http://0.0.0.0:5000/media/files/'+file+'');
                }
                callback()
            })
        },(err)=>{
            res.status(200).json({repo : myDir})
        })
    })
})
// -- Read File
router.route('/files/:path')
    .get( function (req, res) {
        console.log("filesPath")
    res.sendFile(path.join(__dirname+'/files',req.params.path))
});


module.exports = router;