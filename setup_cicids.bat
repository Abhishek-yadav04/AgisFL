@echo off
echo ========================================
echo CICIDS2017 Dataset Setup for AgisFL
echo ========================================
echo.

echo Installing required Python packages...
pip install pandas numpy scikit-learn

echo.
echo Downloading and setting up CICIDS2017 dataset...
cd backend
python dataset_downloader.py

echo.
echo ========================================
echo CICIDS2017 Setup Complete!
echo ========================================
echo.
echo The following datasets have been created:
echo - cicids2017_sample.csv (Main dataset)
echo - cicids2017_client_1.csv (FL Client 1 - Normal traffic)
echo - cicids2017_client_2.csv (FL Client 2 - DoS attacks)
echo - cicids2017_client_3.csv (FL Client 3 - Port scans)
echo - cicids2017_client_4.csv (FL Client 4 - Brute force)
echo - cicids2017_client_5.csv (FL Client 5 - Web attacks)
echo.
echo Your federated learning system now has realistic
echo network intrusion detection data for training!
echo.
pause